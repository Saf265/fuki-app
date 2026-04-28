import { db } from "@/src/db/drizzle/index";
import { vintedSessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-user-id",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Missing x-user-id header" }, { status: 400, headers: corsHeaders });
    }

    const body = await request.json();
    const { accessToken, refreshToken, cookieHeader, anonId, gaClientId } = body;

    if (!accessToken || !refreshToken || !cookieHeader || !anonId || !gaClientId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const connectedAccount = await db.query.connectedAccounts.findFirst({
      where: (ca) => eq(ca.platformUserId, userId),
    });

    if (!connectedAccount) {
      return NextResponse.json({ error: "Vinted account not found" }, { status: 404, headers: corsHeaders });
    }

    await db.update(vintedSessions)
      .set({ accessToken, refreshToken, cookieHeader, anonId, gaClientId })
      .where(eq(vintedSessions.connectedAccountId, connectedAccount.id));

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to update vinted session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
