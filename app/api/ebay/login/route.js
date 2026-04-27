import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Verify user is authenticated
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?error=not_authenticated", request.url),
    );
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.EBAY_REDIRECT_URI);

  // Use basic scopes that are available in sandbox
  const scopes = [
    "https://api.ebay.com/oauth/api_scope/sell.account",
    "https://api.ebay.com/oauth/api_scope/sell.inventory",
  ];
  const scope = encodeURIComponent(scopes.join(" "));

  const authUrl =
    `https://auth.sandbox.ebay.com/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}`;

  return NextResponse.redirect(authUrl);
}
