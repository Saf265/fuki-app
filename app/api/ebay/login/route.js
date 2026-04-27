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
  const redirectUri = process.env.EBAY_REDIRECT_URI

  // Scopes nécessaires pour votre application
  // commerce.identity.readonly est REQUIS pour accéder à l'API Identity
  const scopes = [
    "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.inventory",
    "https://api.ebay.com/oauth/api_scope/commerce.identity.readonly", // Required for Identity API
  ];
  const scope = encodeURIComponent(scopes.join(" "));

  const authUrl =
    `https://auth.sandbox.ebay.com/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&prompt=login`; // Force consent screen

  return NextResponse.redirect(authUrl);
}
