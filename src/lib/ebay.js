import { db } from "@/src/db/drizzle/index";
import { ebaySessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Ensures we have a valid eBay access token for the given connection.
 * If the token is expired (or about to), it refreshes it automatically.
 * @param {string} connectionId - The ID of the connected_accounts record.
 */
export async function getValidEbayToken(connectionId) {
  // Get the eBay session for this connection
  const session = await db.query.ebaySessions.findFirst({
    where: (es, { eq }) => eq(es.connectedAccountId, connectionId),
  });

  if (!session) {
    throw new Error("eBay session not found for this connection");
  }

  const now = new Date();
  const expiresAt = new Date(session.accessTokenExpiresAt);

  // Refresh if token expires in less than 5 minutes
  const isAboutToExpire = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (session.accessToken && !isAboutToExpire) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    throw new Error("No refresh token available");
  }

  console.log(`Refreshing eBay token for connection ${connectionId}...`);

  // 1. Prepare refresh request
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", session.refreshToken);

  const response = await fetch("https://api.sandbox.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

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

  // 2. Update eBay session in database
  await db.update(ebaySessions)
    .set({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken || session.refreshToken,
      accessTokenExpiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(ebaySessions.connectedAccountId, connectionId));

  console.log(`eBay token refreshed successfully for connection ${connectionId}`);

  return newAccessToken;
}
