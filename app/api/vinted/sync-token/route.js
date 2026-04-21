import { db } from "@/src/db/drizzle/index";
import { pendingSyncs, users } from "@/src/db/drizzle/schema";
import { redis } from "@/src/lib/upstash";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

const DEFAULT_USER_ID = "default-user";

export async function GET(request) {
  try {
    // Ensure default user exists
    await db
      .insert(users)
      .values({
        id: DEFAULT_USER_ID,
        name: "Utilisateur",
        email: "default@fuki.app",
      })
      .onConflictDoNothing();

    // Get domain from query params
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain") || "vinted.com";

    // Generate a 5-digit token
    const token = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Store in Redis with TTL (2 minutes)
    await redis.set(
      `pending_sync:${token}`,
      JSON.stringify({ userId: DEFAULT_USER_ID, domain }),
      { ex: 120 },
    );

    // Also store in DB for record keeping
    await db.insert(pendingSyncs).values({
      id: nanoid(),
      userId: DEFAULT_USER_ID,
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
