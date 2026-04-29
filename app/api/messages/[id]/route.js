import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VINTED_API_URL = process.env.VINTED_API_URL;

export async function GET(request, { params }) {
  console.log("=== /api/messages/[id] called ===");

  const { id: conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  console.log("Conversation ID:", conversationId);
  console.log("Account ID:", accountId);

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id manquant" }, { status: 400 });
  }

  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      console.error("User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("User ID:", userId);

    // ─── Handle Vinted messages ────────────────────────────────────────────────
    console.log("Fetching Vinted messages...");

    const [account] = await db
      .select({
        platformUserId: connectedAccounts.platformUserId,
        accessToken: vintedSessions.accessToken,
        refreshToken: vintedSessions.refreshToken,
        csrfToken: vintedSessions.csrfToken,
        cookieHeader: vintedSessions.cookieHeader,
        userAgent: vintedSessions.userAgent,
        anonId: vintedSessions.anonId,
        domain: vintedSessions.domain,
        warmedUp: vintedSessions.warmedUp,
        warmedAt: vintedSessions.warmedAt,
      })
      .from(connectedAccounts)
      .innerJoin(vintedSessions, eq(vintedSessions.connectedAccountId, connectedAccounts.id))
      .where(
        accountId
          ? eq(connectedAccounts.id, accountId)
          : eq(connectedAccounts.userId, userId)
      )
      .limit(1);

    if (!account) {
      console.error("Vinted account not found");
      return NextResponse.json({ error: "Compte Vinted introuvable" }, { status: 404 });
    }

    console.log("Vinted account found");

    const res = await fetch(
      `${VINTED_API_URL}/api/get-messages?conversation_id=${conversationId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: account.domain,
          access_token: account.accessToken,
          refresh_token: account.refreshToken,
          user_id: account.platformUserId,
          warmed_at: account.warmedAt || null,
          warmed_up: account.warmedUp || false,
          anon_id: account.anonId || "",
          csrf_token: account.csrfToken || "",
          user_agent: account.userAgent || "",
          cookie_header: account.cookieHeader || "",
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    console.log("Vinted API response status:", res.status);

    if (!res.ok) {
      console.error("Vinted API error:", res.status);
      throw new Error(`Vinted API error ${res.status}`);
    }

    const data = await res.json();
    console.log("Vinted messages count:", data.messages?.length || 0);

    return NextResponse.json({ ...data, platform: "vinted" });
  } catch (error) {
    console.error("=== Get messages error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
