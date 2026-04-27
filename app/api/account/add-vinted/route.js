import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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
      csrf_token,
      anon_id,
      cookie_header,
    } = await req.json();

    console.log("=== Vinted Account Add Request ===");
    console.log("Username:", vintedUsername);
    console.log("User ID from extension:", userId);
    console.log("Vinted User ID:", vintedUserId);
    console.log("Domain:", domain);

    if (!vintedUsername || !access_token || !refresh_token || !domain || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing credentials" },
        { headers: corsHeaders },
      );
    }

    // Check if this Vinted account already exists (by platformUserId)
    const existing = await db.query.connectedAccounts.findFirst({
      where: (ca, { and, eq }) => and(
        eq(ca.platform, "vinted"),
        eq(ca.platformUserId, vintedUserId ?? ""),
      ),
    });

    let accountId;

    if (existing) {
      console.log("Updating existing account:", existing.id);
      console.log("Old userId:", existing.userId, "-> New userId:", userId);

      accountId = existing.id;

      // Update base account (including userId in case it changed)
      await db.update(connectedAccounts)
        .set({
          username: vintedUsername,
          userId: userId, // Update userId to current authenticated user
          updatedAt: new Date()
        })
        .where(eq(connectedAccounts.id, accountId));

      // Upsert vinted session
      const existingSession = await db.query.vintedSessions.findFirst({
        where: (vs, { eq }) => eq(vs.connectedAccountId, accountId),
      });

      if (existingSession) {
        await db.update(vintedSessions)
          .set({
            accessToken: access_token,
            refreshToken: refresh_token,
            csrfToken: csrf_token ?? null,
            cookieHeader: cookie_header ?? null,
            userAgent: userAgent ?? null,
            anonId: anon_id ?? null,
            gaClientId: gaClientId ?? null,
            domain,
            updatedAt: new Date(),
          })
          .where(eq(vintedSessions.connectedAccountId, accountId));
      } else {
        await db.insert(vintedSessions).values({
          id: nanoid(),
          connectedAccountId: accountId,
          accessToken: access_token,
          refreshToken: refresh_token,
          csrfToken: csrf_token ?? null,
          cookieHeader: cookie_header ?? null,
          userAgent: userAgent ?? null,
          anonId: anon_id ?? null,
          gaClientId: gaClientId ?? null,
          domain,
        });
      }
    } else {
      // Create new connected account + vinted session
      accountId = nanoid();
      console.log("Creating new account:", accountId);

      await db.insert(connectedAccounts).values({
        id: accountId,
        userId: userId,
        platform: "vinted",
        username: vintedUsername,
        platformUserId: vintedUserId ?? null,
      });

      await db.insert(vintedSessions).values({
        id: nanoid(),
        connectedAccountId: accountId,
        accessToken: access_token,
        refreshToken: refresh_token,
        csrfToken: csrf_token ?? null,
        cookieHeader: cookie_header ?? null,
        userAgent: userAgent ?? null,
        anonId: anon_id ?? null,
        gaClientId: gaClientId ?? null,
        domain,
      });
    }

    console.log("Vinted account added successfully");
    return NextResponse.json(
      { success: true, message: "Vinted account added successfully" },
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
