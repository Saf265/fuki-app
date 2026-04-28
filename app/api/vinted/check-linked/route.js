import { db } from "@/src/db/drizzle/index";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-user-id",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ linked: false }, { status: 400, headers: corsHeaders });
  }

  const account = await db.query.connectedAccounts.findFirst({
    where: (ca) => eq(ca.platformUserId, userId),
  });

  return NextResponse.json({ linked: !!account }, { headers: corsHeaders });
}
