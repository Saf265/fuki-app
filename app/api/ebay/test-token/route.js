import { db } from "@/src/db/drizzle/index";
import { auth } from "@/src/lib/auth";
import { getValidEbayToken } from "@/src/lib/ebay";
import { NextResponse } from "next/server";

export async function GET(request) {
  console.log("=== /api/ebay/test-token called ===");

  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    console.log("User session:", session ? "Found" : "Not found");

    if (!session?.user?.id) {
      console.error("User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("User ID:", userId);

    // Get user's eBay connections
    const ebayAccounts = await db.query.connectedAccounts.findMany({
      where: (ca, { and, eq }) => and(
        eq(ca.userId, userId),
        eq(ca.platform, "ebay")
      ),
    });

    console.log("eBay accounts found:", ebayAccounts.length);

    if (ebayAccounts.length === 0) {
      console.error("No eBay account connected for user:", userId);
      return NextResponse.json({ error: "No eBay account connected" }, { status: 404 });
    }

    const connectionId = ebayAccounts[0].id;
    console.log("Using connection ID:", connectionId);

    // Test token refresh
    console.log("Calling getValidEbayToken...");
    const token = await getValidEbayToken(connectionId);
    console.log("Token received, length:", token.length);

    return NextResponse.json({
      success: true,
      message: "Token is valid",
      tokenPreview: token.substring(0, 30) + "...",
      connectionId,
    });
  } catch (error) {
    console.error("=== Token test error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
