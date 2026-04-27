import { db } from "@/src/db/drizzle/index";
import { auth } from "@/src/lib/auth";
import { getValidEbayToken } from "@/src/lib/ebay";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's eBay connections
    const ebayAccounts = await db.query.connectedAccounts.findMany({
      where: (ca, { and, eq }) => and(
        eq(ca.userId, userId),
        eq(ca.platform, "ebay")
      ),
    });

    if (ebayAccounts.length === 0) {
      return NextResponse.json({ error: "No eBay account connected" }, { status: 404 });
    }

    const connectionId = ebayAccounts[0].id;

    // Test token refresh
    const token = await getValidEbayToken(connectionId);

    return NextResponse.json({
      success: true,
      message: "Token is valid",
      tokenPreview: token.substring(0, 30) + "...",
      connectionId,
    });
  } catch (error) {
    console.error("Token test error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
