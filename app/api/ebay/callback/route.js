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
  let username = null;
  let platformUserId = null;
  let email = null;

  console.log("=== eBay Identity API Call ===");
  console.log("Access token (first 20 chars):", access_token?.substring(0, 20));
  console.log("Scopes received:", scope);

  try {
    const userRes = await fetch("https://api.sandbox.ebay.com/commerce/identity/v1/user/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    console.log("Identity API status:", userRes.status);

    if (userRes.ok) {
      const userData = await userRes.json();
      console.log("Identity API response:", JSON.stringify(userData, null, 2));

      // Extract userId (always present in the response)
      platformUserId = userData.userId;

      // Extract username and email based on account type
      if (userData.accountType === "INDIVIDUAL" && userData.individualAccount) {
        const individual = userData.individualAccount;
        username = individual.firstName && individual.lastName
          ? `${individual.firstName} ${individual.lastName}`
          : userData.username;
        email = individual.email;
      } else if (userData.accountType === "BUSINESS" && userData.businessAccount) {
        const business = userData.businessAccount;
        username = business.name || business.doingBusinessAs || userData.username;
        email = business.email;
      } else {
        username = userData.username;
      }

      console.log("Extracted:", { platformUserId, username, email });
    } else {
      const errorText = await userRes.text();
      console.error("Identity API error response:", errorText);
    }
  } catch (e) {
    console.error("eBay identity fetch exception:", e);
  }

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
    accountId = existing.id;
    await db.update(connectedAccounts)
      .set({ username, updatedAt: new Date() })
      .where(eq(connectedAccounts.id, accountId));

    const existingSession = await db.query.ebaySessions.findFirst({
      where: (es, { eq }) => eq(es.connectedAccountId, accountId),
    });

    if (existingSession) {
      await db.update(ebaySessions)
        .set({ accessToken: access_token, refreshToken: refresh_token, accessTokenExpiresAt, scope: scope ?? null, updatedAt: new Date() })
        .where(eq(ebaySessions.connectedAccountId, accountId));
    } else {
      await db.insert(ebaySessions).values({
        id: nanoid(),
        connectedAccountId: accountId,
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt,
        scope: scope ?? null,
      });
    }
  } else {
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
      scope: scope ?? null,
    });
  }

  return NextResponse.redirect(
    new URL("/dashboard/connections?success=ebay", request.url),
  );
}
