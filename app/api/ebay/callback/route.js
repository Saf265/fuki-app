import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, ebaySessions, users } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

const DEFAULT_USER_ID = "default-user";

export async function GET(request) {
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
  const redirectUri = process.env.EBAY_REDIRECT_URI;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);

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

  try {
    const userRes = await fetch("https://apiz.sandbox.ebay.com/commerce/identity/v1/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      platformUserId = userData.userId || userData.username || null;
      username =
        userData.individualAccount?.firstName ||
        userData.businessAccount?.businessName ||
        userData.username ||
        null;
    }
  } catch (e) {
    console.warn("eBay identity fetch failed:", e.message);
  }

  // ─── 3. Ensure default user exists ───────────────────────────────────────
  await db.insert(users).values({
    id: DEFAULT_USER_ID,
    name: "Utilisateur",
    email: "default@fuki.app",
  }).onConflictDoNothing();

  // ─── 4. Upsert connected account + ebay session ───────────────────────────
  const accessTokenExpiresAt = new Date(Date.now() + expires_in * 1000);

  const existing = platformUserId
    ? await db.query.connectedAccounts.findFirst({
      where: (ca, { and, eq }) => and(
        eq(ca.userId, DEFAULT_USER_ID),
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
      userId: DEFAULT_USER_ID,
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
