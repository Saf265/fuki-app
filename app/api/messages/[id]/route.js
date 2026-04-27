import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, ebaySessions, vintedSessions } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { getValidEbayToken } from "@/src/lib/ebay";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VINTED_API_URL = process.env.VINTED_API_URL;

export async function GET(request, { params }) {
  console.log("=== /api/messages/[id] called ===");

  const { id: conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const platform = searchParams.get("platform") || "vinted"; // Default to vinted for backward compatibility

  console.log("Conversation ID:", conversationId);
  console.log("Account ID:", accountId);
  console.log("Platform:", platform);

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

    // ─── Handle eBay messages ─────────────────────────────────────────────────
    if (platform === "ebay") {
      console.log("Fetching eBay messages...");

      // Get the eBay account
      const [account] = await db
        .select({
          accountId: connectedAccounts.id,
          username: connectedAccounts.username,
        })
        .from(connectedAccounts)
        .innerJoin(ebaySessions, eq(ebaySessions.connectedAccountId, connectedAccounts.id))
        .where(
          accountId
            ? eq(connectedAccounts.id, accountId)
            : eq(connectedAccounts.userId, userId)
        )
        .limit(1);

      if (!account) {
        console.error("eBay account not found");
        return NextResponse.json({ error: "Compte eBay introuvable" }, { status: 404 });
      }

      console.log("eBay account found:", account.username);

      // Get valid token (will refresh if needed)
      const token = await getValidEbayToken(account.accountId);
      console.log("Got valid eBay token");

      // Fetch messages from eBay API
      const url = `https://api.sandbox.ebay.com/commerce/message/v1/conversation/${conversationId}?conversation_type=FROM_MEMBERS`;
      console.log("eBay API URL:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      console.log("eBay API response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("eBay API error:", errorText);
        throw new Error(`eBay API error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("eBay API raw response:", JSON.stringify(data, null, 2));
      console.log("eBay messages count:", data.messages?.length || 0);

      // Transform eBay response to include all fields
      const transformedData = {
        conversationId: conversationId,
        conversationStatus: data.conversationStatus,
        conversationTitle: data.conversationTitle,
        conversationType: data.conversationType,
        messages: (data.messages || []).map(msg => ({
          messageId: msg.messageId,
          messageBody: msg.messageBody,
          subject: msg.subject,
          createdDate: msg.createdDate,
          senderUsername: msg.senderUsername,
          recipientUsername: msg.recipientUsername,
          readStatus: msg.readStatus,
          messageMedia: msg.messageMedia || [],

          // For compatibility with Vinted format
          id: msg.messageId,
          body: msg.messageBody,
          created_at: msg.createdDate,
          is_read: msg.readStatus,
        })),
        pagination: {
          total: data.total,
          limit: data.limit,
          offset: data.offset,
          next: data.next,
          prev: data.prev,
          href: data.href,
        },
        platform: "ebay",
      };

      return NextResponse.json(transformedData);
    }

    // ─── Handle Vinted messages (default) ─────────────────────────────────────
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
