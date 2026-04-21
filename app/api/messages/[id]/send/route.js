import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VINTED_API_URL = process.env.VINTED_API_URL;

export async function POST(request, { params }) {
  const { id: conversationId } = await params;

  try {
    const body = await request.json();
    const { accountId, text, photo_ids, offer_price } = body;

    if (!accountId) {
      return NextResponse.json({ error: "accountId manquant" }, { status: 400 });
    }

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
      .where(eq(connectedAccounts.id, accountId))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    const sessionData = {
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
    };

    // Offre de prix
    if (offer_price !== undefined) {
      const res = await fetch(
        `${VINTED_API_URL}/api/send-offer?conversation_id=${conversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...sessionData, offer_price }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return NextResponse.json(await res.json());
    }

    // Message texte (+ photos optionnelles)
    const res = await fetch(
      `${VINTED_API_URL}/api/send-message?conversation_id=${conversationId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sessionData,
          body: text || "",
          photo_ids: photo_ids || [],
        }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
