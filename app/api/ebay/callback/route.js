import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, users } from "@/src/db/drizzle/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const DEFAULT_USER_ID = "default-user";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // eBay denied access
  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=ebay_denied", request.url),
    );
  }

  // ─── 1. Exchange code for tokens ────────────────────────────────────────────
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const redirectUri = process.env.EBAY_REDIRECT_URI;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);

  const bodyString = params.toString();

  const tokenRes = await fetch(
    "https://api.sandbox.ebay.com/identity/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyString,
    },
  );

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("eBay token exchange failed:", errorText);
    return NextResponse.redirect(
      new URL("/dashboard/connections?error=ebay_token", request.url),
    );
  }

  const tokenData = await tokenRes.json();
  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  } = tokenData;

  // ─── 2. Fetch seller identity from eBay ────────────────────────────────────
  let firstName = null;
  let lastName = null;
  let email = null;
  let platformUserId = null;

  try {
    const userRes = await fetch(
      "https://apiz.sandbox.ebay.com/commerce/identity/v1/user",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    
    if (userRes.ok) {
      const userData = await userRes.json();
      platformUserId = userData.userId || userData.username || null;
      email = userData.email || null;
      
      if (userData.individualAccount) {
        firstName = userData.individualAccount.firstName || null;
        lastName = userData.individualAccount.lastName || null;
      } 
      if (userData.businessAccount) {
        firstName = userData.businessAccount.contactFirstName || userData.businessAccount.businessName || null;
        lastName = userData.businessAccount.contactLastName || null;
      }
    }
  } catch (e) {
    console.warn("Exception during eBay identity fetch:", e.message);
  }

  // Ensure default user exists
  await db.insert(users).values({
    id: DEFAULT_USER_ID,
    name: "Utilisateur",
    email: "default@fuki.app",
  }).onConflictDoNothing();

  // ─── 4. Upsert into connected_accounts ──────────────────────────────────────
  const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Check if account already exists for this user and platformUserId
  let existingAccount = null;
  if (platformUserId) {
    existingAccount = await db.query.connectedAccounts.findFirst({
      where: (ca, { and, eq }) => and(
        eq(ca.userId, DEFAULT_USER_ID),
        eq(ca.platform, "ebay"),
        eq(ca.platformUserId, platformUserId)
      )
    });
  }

  if (existingAccount) {
    // Update existing account
    await db.update(connectedAccounts)
      .set({
        firstName,
        lastName,
        email,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(connectedAccounts.id, existingAccount.id));
  } else {
    // Create new account
    await db
      .insert(connectedAccounts)
      .values({
        id: nanoid(),
        userId: DEFAULT_USER_ID,
        platform: "ebay",
        firstName,
        lastName,
        email,
        platformUserId,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
      });
  }

  return NextResponse.redirect(
    new URL("/dashboard/connections?success=ebay", request.url),
  );
}
