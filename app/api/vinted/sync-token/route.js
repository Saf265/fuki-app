import { db } from "@/src/db/drizzle/index";
import { pendingSyncs } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { redis } from "@/src/lib/upstash";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get domain from query params
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain") || "vinted.fr";

    // Generate a 5-digit token
    const token = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Store in Redis with TTL (2 minutes)
    // Map token -> { userId, domain }
    await redis.set(
      `pending_sync:${token}`,
      JSON.stringify({ userId: session.user.id, domain }),
      { ex: 120 },
    );

    // Also store in DB for record keeping
    await db.insert(pendingSyncs).values({
      id: nanoid(),
      userId: session.user.id,
      token: token,
      domain: domain,
      expiresAt: expiresAt,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Failed to generate sync token:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
