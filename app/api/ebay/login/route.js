import { NextResponse } from "next/server";

export function GET() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.EBAY_REDIRECT_URI);
  const scope = encodeURIComponent(
    "https://api.ebay.com/oauth/api_scope/commerce.identity.readonly https://api.ebay.com/oauth/api_scope/commerce.identity.email.readonly https://api.ebay.com/oauth/api_scope/commerce.message https://api.ebay.com/oauth/api_scope/sell.account",
  );

  const authUrl =
    `https://auth.sandbox.ebay.com/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&prompt=login`; // Force login to ensure fresh tokens during testing

  return NextResponse.redirect(authUrl);
}
