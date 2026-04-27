import { db } from "@/src/db/drizzle/index";
import { ebaySessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Ensures we have a valid eBay access token for the given connection.
 * If the token is expired (or about to), it refreshes it automatically.
 * @param {string} connectionId - The ID of the connected_accounts record.
 */
export async function getValidEbayToken(connectionId) {
  console.log("=== getValidEbayToken called ===");
  console.log("Connection ID:", connectionId);

  // Get the eBay session for this connection
  const session = await db.query.ebaySessions.findFirst({
    where: (es, { eq }) => eq(es.connectedAccountId, connectionId),
  });

  console.log("Session found:", session ? "Yes" : "No");

  if (!session) {
    console.error("No eBay session found for connection:", connectionId);
    throw new Error("eBay session not found for this connection");
  }

  console.log("Session details:", {
    hasAccessToken: !!session.accessToken,
    hasRefreshToken: !!session.refreshToken,
    expiresAt: session.accessTokenExpiresAt,
  });

  const now = new Date();
  const expiresAt = new Date(session.accessTokenExpiresAt);

  // Refresh if token expires in less than 5 minutes
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const isAboutToExpire = timeUntilExpiry < 5 * 60 * 1000;

  console.log("Token expiry check:", {
    now: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    timeUntilExpiryMinutes: Math.round(timeUntilExpiry / 60000),
    isAboutToExpire,
  });

  if (session.accessToken && !isAboutToExpire) {
    console.log("✓ Token is still valid, returning existing token");
    return session.accessToken;
  }

  if (!session.refreshToken) {
    console.error("No refresh token available");
    throw new Error("No refresh token available");
  }

  console.log("⟳ Token needs refresh, starting refresh process...");

  // 1. Prepare refresh request
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", session.refreshToken);

  console.log("Calling eBay token refresh API...");

  const response = await fetch("https://api.sandbox.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  console.log("eBay refresh API response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("eBay token refresh failed:", errorText);
    throw new Error("Failed to refresh eBay token");
  }

  const data = await response.json();
  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token; // eBay returns a new refresh token too
  const expiresIn = data.expires_in;
  const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

  console.log("New token received:", {
    hasNewAccessToken: !!newAccessToken,
    hasNewRefreshToken: !!newRefreshToken,
    expiresIn: expiresIn,
    newExpiresAt: newExpiresAt.toISOString(),
  });

  // 2. Update eBay session in database
  console.log("Updating database with new tokens...");

  await db.update(ebaySessions)
    .set({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken || session.refreshToken,
      accessTokenExpiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(ebaySessions.connectedAccountId, connectionId));

  console.log("✓ eBay token refreshed successfully for connection:", connectionId);

  return newAccessToken;
}
