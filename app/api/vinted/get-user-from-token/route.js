import { redis } from "@/src/lib/upstash";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Private-Network": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("=== Get User From Token ===");
    console.log("Token:", token);

    // Get userId from Redis
    const data = await redis.get(`pending_sync:${token}`);

    if (!data) {
      return NextResponse.json(
        { error: "Token not found or expired" },
        { status: 404, headers: corsHeaders }
      );
    }

    const { userId, domain } = JSON.parse(data);

    console.log("User ID found:", userId);
    console.log("Domain:", domain);

    return NextResponse.json(
      { userId, domain },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to get user from token:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
