import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VINTED_API_URL = process.env.VINTED_API_URL;

export async function POST(request, { params }) {
  const { id: conversationId } = await params;

  try {
    const body = await request.json();
    const { accountId, transaction_id, offer_id } = body;

    if (!accountId || !transaction_id || !offer_id) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
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
      .innerJoin(
        vintedSessions,
        eq(vintedSessions.connectedAccountId, connectedAccounts.id)
      )
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

    console.log("❌ Refus d'offre:", {
      transaction_id,
      offer_id,
      conversation_id: conversationId,
    });

    const params = new URLSearchParams({
      transaction_id: transaction_id.toString(),
      offer_id: offer_id.toString(),
      accept: "false",
      conversation_id: conversationId.toString(),
    });

    const url = `${VINTED_API_URL}/api/accept-reject-offer?${params}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionData),
      signal: AbortSignal.timeout(10000),
    });

    console.log("📡 Status:", res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Erreur API reject:", {
        status: res.status,
        statusText: res.statusText,
        body: errorText,
        url: url,
      });
      throw new Error(`API error ${res.status}: ${errorText}`);
    }

    const responseText = await res.text();
    console.log("✅ Réponse brute API reject:", responseText);

    let data = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error("❌ Erreur parsing JSON:", e);
    }

    if (!data || data === null) {
      console.log("✅ Offre refusée (réponse vide/null)");
      return NextResponse.json({
        success: true,
        message: "Offre refusée",
        transaction_id,
        offer_id,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Reject offer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
