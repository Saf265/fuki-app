import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VINTED_API_URL = process.env.VINTED_API_URL;

export async function POST(request, { params }) {
  console.log("=== /api/messages/[id]/send called ===");

  const { id: conversationId } = await params;
  console.log("Conversation ID:", conversationId);

  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      console.error("User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("User ID:", userId);

    const body = await request.json();
    const { accountId, text, photo_url, offer_price } = body;
    console.log("Request body:", { accountId, hasText: !!text, hasPhoto: !!photo_url, hasOffer: offer_price !== undefined });

    if (!accountId) {
      return NextResponse.json({ error: "accountId manquant" }, { status: 400 });
    }

    // ─── Handle Vinted message ─────────────────────────────────────────────────
    console.log("Sending Vinted message...");

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
      console.error("Vinted account not found");
      return NextResponse.json({ error: "Compte Vinted introuvable" }, { status: 404 });
    }

    console.log("Vinted account found");

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
      const transactionId = body.transaction_id;
      const isSeller = body.is_seller;

      if (!transactionId) {
        return NextResponse.json({ error: "transaction_id manquant" }, { status: 400 });
      }

      console.log("💰 Envoi d'une offre:", {
        transaction_id: transactionId,
        conversation_id: conversationId,
        price: offer_price,
        is_seller: isSeller,
      });

      const params = new URLSearchParams({
        transaction_id: transactionId,
        conversation_id: conversationId,
        price: offer_price.toString(),
        is_seller: isSeller ? "true" : "false",
      });

      const url = `${VINTED_API_URL}/send_offer?${params}`;
      console.log("🔗 URL:", url);
      console.log("📦 Body:", JSON.stringify(sessionData, null, 2));

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
        signal: AbortSignal.timeout(10000),
      });

      console.log("📡 Status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Erreur API offre:", {
          status: res.status,
          statusText: res.statusText,
          body: errorText,
          url: url
        });
        throw new Error(`API error ${res.status}: ${errorText}`);
      }

      const responseText = await res.text();
      console.log("✅ Réponse brute API offre:", responseText);

      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error("❌ Erreur parsing JSON:", e);
      }

      // Si l'API retourne null ou vide, on considère que c'est un succès
      if (!data || data === null) {
        console.log("✅ Offre envoyée (réponse vide/null)");
        return NextResponse.json({
          success: true,
          message: "Offre envoyée",
          transaction_id: transactionId,
          price: offer_price
        });
      }

      // L'API peut retourner { conversation: {...}, code: 0 } ou directement les données
      const responseData = data?.conversation || data;
      const offerId = responseData?.transaction?.offer_id || responseData?.offer_id || "N/A";

      console.log("✅ Offre envoyée, offer_id:", offerId);
      return NextResponse.json(data);
    }

    // Message texte (+ photo optionnelle)
    const message = text?.trim() || "";
    const photoUrl = photo_url?.trim() || "";

    console.log("💬 Envoi d'un message:", { message, photoUrl });

    const params = new URLSearchParams({
      conversation_id: conversationId,
      message: message,
      photo_url: photoUrl,
    });

    const res = await fetch(
      `${VINTED_API_URL}/api/reply-to-conversation?${params}`,
      {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Erreur API:", res.status, errorText);
      throw new Error(`API error ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Message envoyé");
    return NextResponse.json(data);
  } catch (error) {
    console.error("=== Send message error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
