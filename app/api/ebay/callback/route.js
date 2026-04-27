import { fetchUserEbayPolicies, getUserMarketplace } from "@/lib/ebay/identity";
import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, ebaySessions } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";


export async function GET(request) {
  // ─── 0. Get authenticated user ───────────────────────────────────────────
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?error=not_authenticated", request.url),
    );
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=ebay_denied", request.url),
    );
  }

  // ─── 1. Exchange code for tokens ─────────────────────────────────────────
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.EBAY_REDIRECT_URI);

  const tokenRes = await fetch("https://api.sandbox.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    console.error("eBay token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=ebay_token", request.url),
    );
  }

  const { access_token, refresh_token, expires_in, scope } = await tokenRes.json();

  // ─── 2. Fetch seller identity ─────────────────────────────────────────────
  let platformUserId = null;
  let username = "eBay User";
  let marketplaceId = "EBAY_US"; // Default marketplace

  console.log("=== eBay User Info Fetch ===");
  console.log("Access token (first 20 chars):", access_token?.substring(0, 20));
  console.log("Scopes received:", scope);

  try {
    // Try to get marketplace info (may fail in sandbox)
    const marketplaceInfo = await getUserMarketplace(access_token);
    if (marketplaceInfo) {
      marketplaceId = marketplaceInfo.marketplaceId || marketplaceId;
      username = marketplaceInfo.username || username;
      console.log("Marketplace info retrieved:", marketplaceInfo);
    } else {
      console.log("Marketplace info not available (sandbox limitation)");
    }
  } catch (e) {
    console.error("Error fetching marketplace info:", e);
  }

  try {
    // Commerce Identity API is not available in sandbox
    // For sandbox, extract user ID from token
    // Token format: v^1.1#i^1#I^3#f^0#p^3#r^0#t^...
    // i^ = user id (simple)
    // I^ = institution/account id (more unique)
    const tokenParts = access_token.split('#');

    // Try to get the more unique identifier first (I^)
    const institutionIdPart = tokenParts.find(part => part.startsWith('I^'));
    const userIdPart = tokenParts.find(part => part.startsWith('i^'));

    if (institutionIdPart) {
      // Use institution ID as it's more unique
      platformUserId = `ebay_${institutionIdPart.substring(2)}`;
    } else if (userIdPart) {
      // Fallback to user ID
      platformUserId = `ebay_${userIdPart.substring(2)}`;
    } else {
      // Last resort fallback
      platformUserId = `sandbox_${Date.now()}`;
    }
  } catch (e) {
    console.error("eBay user info extraction exception:", e);
    // Fallback
    platformUserId = `sandbox_${Date.now()}`;
  }

  // Fetch policies (may fail in sandbox)
  let paymentPolicyId = null;
  let fulfillmentPolicyId = null;
  let returnPolicyId = null;

  try {
    const policiesResult = await fetchUserEbayPolicies(access_token, marketplaceId);
    if (policiesResult?.success && policiesResult?.policies) {
      // Get first policy of each type if available
      const firstPayment = policiesResult.policies.payment?.[0];
      const firstFulfillment = policiesResult.policies.fulfillment?.[0];
      const firstReturn = policiesResult.policies.return?.[0];

      paymentPolicyId = firstPayment?.paymentPolicyId || null;
      fulfillmentPolicyId = firstFulfillment?.fulfillmentPolicyId || null;
      returnPolicyId = firstReturn?.returnPolicyId || null;

      console.log("Policies retrieved:", {
        payment: paymentPolicyId,
        fulfillment: fulfillmentPolicyId,
        return: returnPolicyId
      });
    } else {
      console.log("Policies not available (sandbox limitation or no policies configured)");
    }
  } catch (e) {
    console.error("Error fetching policies:", e);
  }

  console.log("=== eBay Account Info ===");
  console.log("Platform User ID:", platformUserId);
  console.log("Username:", username);
  console.log("Marketplace ID:", marketplaceId);

  // ─── 3. Upsert connected account + ebay session ───────────────────────────
  const accessTokenExpiresAt = new Date(Date.now() + expires_in * 1000);

  const existing = platformUserId
    ? await db.query.connectedAccounts.findFirst({
      where: (ca, { and, eq }) => and(
        eq(ca.userId, userId),
        eq(ca.platform, "ebay"),
        eq(ca.platformUserId, platformUserId),
      ),
    })
    : null;

  let accountId;

  if (existing) {
    console.log("Updating existing eBay account:", existing.id);
    accountId = existing.id;
    await db.update(connectedAccounts)
      .set({ username, updatedAt: new Date() })
      .where(eq(connectedAccounts.id, accountId));

    const existingSession = await db.query.ebaySessions.findFirst({
      where: (es, { eq }) => eq(es.connectedAccountId, accountId),
    });

    if (existingSession) {
      await db.update(ebaySessions)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token,
          accessTokenExpiresAt,
          paymentPolicyId,
          fulfillmentPolicyId,
          returnPolicyId,
          marketplaceId,
          scope: scope ?? null,
          updatedAt: new Date()
        })
        .where(eq(ebaySessions.connectedAccountId, accountId));
    } else {
      await db.insert(ebaySessions).values({
        id: nanoid(),
        connectedAccountId: accountId,
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt,
        paymentPolicyId,
        fulfillmentPolicyId,
        returnPolicyId,
        marketplaceId,
        scope: scope ?? null,
      });
    }
  } else {
    console.log("Creating new eBay account");
    accountId = nanoid();
    await db.insert(connectedAccounts).values({
      id: accountId,
      userId: userId,
      platform: "ebay",
      username,
      platformUserId,
    });
    await db.insert(ebaySessions).values({
      id: nanoid(),
      connectedAccountId: accountId,
      accessToken: access_token,
      refreshToken: refresh_token,
      accessTokenExpiresAt,
      paymentPolicyId,
      fulfillmentPolicyId,
      returnPolicyId,
      marketplaceId,
      scope: scope ?? null,
    });
  }

  console.log("eBay account connected successfully");

  return NextResponse.redirect(
    new URL("/dashboard/connections?success=ebay", request.url),
  );
}
