import { db } from "@/src/db/drizzle/index";
import { connectedAccounts } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

  console.log("--- DEBUG EBAY TOKEN EXCHANGE ---");
  console.log("URL:", "https://api.sandbox.ebay.com/identity/v1/oauth2/token");
  console.log("Auth Header (trimmed):", `Basic ${basicAuth.substring(0, 10)}...`);
  console.log("Body:", bodyString);
  console.log("------------------");

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
    console.log("--- DEBUG EBAY IDENTITY FETCH ---");
    const userRes = await fetch(
      "https://apiz.sandbox.ebay.com/commerce/identity/v1/user",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    
    if (userRes.ok) {
      const userData = await userRes.json();
      console.log("User Data Received:", JSON.stringify(userData, null, 2));
      platformUserId = userData.userId ?? userData.username ?? null;
      email = userData.email ?? null;
      
      // Try to get name from individual OR business account
      if (userData.individualAccount) {
        firstName = userData.individualAccount.firstName ?? null;
        lastName = userData.individualAccount.lastName ?? null;
      } else if (userData.businessAccount) {
        firstName = userData.businessAccount.contactFirstName ?? null;
        lastName = userData.businessAccount.contactLastName ?? null;
        // fallback to business name if no contact name
        if (!firstName) firstName = userData.businessAccount.businessName;
      }
    } else {
      const errorText = await userRes.text();
      console.error("eBay Identity Fetch Failed:", userRes.status, errorText);
    }
    console.log("------------------");
  } catch (e) {
    console.warn("Could not fetch eBay user identity:", e.message);
  }

  // ─── 3. Get current Fuki session ────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?error=not_authenticated", request.url),
    );
  }

  // ─── 4. Upsert into connected_accounts ──────────────────────────────────────
  const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await db
    .insert(connectedAccounts)
    .values({
      id: nanoid(),
      userId: session.user.id,
      platform: "ebay",
      firstName,
      lastName,
      email,
      platformUserId,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
    })
    .onConflictDoNothing(); // simple insert — extend with upsert logic if needed

  return NextResponse.redirect(
    new URL("/dashboard/connections?success=ebay", request.url),
  );
}
