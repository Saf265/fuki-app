import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const DEFAULT_USER_ID = "default-user";
const VINTED_API_URL = process.env.VINTED_API_URL;

export async function GET(request, { params }) {
  const { id: conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id manquant" }, { status: 400 });
  }

  try {
    // Récupère la session Vinted du compte concerné
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
          : eq(connectedAccounts.userId, DEFAULT_USER_ID)
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

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

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
