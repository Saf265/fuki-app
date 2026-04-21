import { db } from "@/src/db/drizzle/index";
import { connectedAccounts } from "@/src/db/drizzle/schema";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

const DEFAULT_USER_ID = "default-user";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Private-Network": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const {
      vintedUsername,
      access_token,
      refresh_token,
      userId,
      gaClientId,
      domain,
      vintedUserId,
      userAgent,
    } = await req.json();

    if (!vintedUsername || !access_token || !refresh_token || !domain) {
      return NextResponse.json(
        { success: false, error: "Missing credentials" },
        { headers: corsHeaders },
      );
    }

    await db.insert(connectedAccounts).values({
      id: nanoid(),
      userId: userId,
      platform: "vinted",
      firstName: vintedUsername,
      lastName: null,
      platformUserId: vintedUserId,
      accessToken: access_token,
      refreshToken: refresh_token,
      gaClientId: gaClientId,
      accessTokenExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userAgent: userAgent,
      domain: domain,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vinted account added successfully",
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Vinted add error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders },
    );
  }
}
