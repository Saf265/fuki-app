import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, ebaySessions, vintedSessions } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { getValidEbayToken } from "@/src/lib/ebay";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VINTED_API_URL = process.env.VINTED_API_URL;

export async function GET(request) {
  console.log("=== /api/messages called ===");

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const per_page = searchParams.get("per_page") || "10";

  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    console.log("Session:", session ? "Found" : "Not found");
    console.log("Session user:", session?.user);

    if (!session?.user?.id) {
      console.error("User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("User ID:", userId);

    // ─── Fetch Vinted conversations ───────────────────────────────────────────
    console.log("Fetching Vinted accounts...");
    const vintedAccounts = await db
      .select({
        accountId: connectedAccounts.id,
        username: connectedAccounts.username,
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
      .where(eq(connectedAccounts.userId, userId));

    console.log("Vinted accounts found:", vintedAccounts.length);
    if (vintedAccounts.length > 0) {
      console.log("Vinted accounts:", vintedAccounts.map(a => ({ id: a.accountId, username: a.username })));
    }

    // ─── Fetch eBay conversations ─────────────────────────────────────────────
    console.log("Fetching eBay accounts...");
    const ebayAccounts = await db
      .select({
        accountId: connectedAccounts.id,
        username: connectedAccounts.username,
        platformUserId: connectedAccounts.platformUserId,
      })
      .from(connectedAccounts)
      .innerJoin(ebaySessions, eq(ebaySessions.connectedAccountId, connectedAccounts.id))
      .where(eq(connectedAccounts.userId, userId));

    console.log("eBay accounts found:", ebayAccounts.length);
    if (ebayAccounts.length > 0) {
      console.log("eBay accounts:", ebayAccounts.map(a => ({ id: a.accountId, username: a.username })));
    }

    if (vintedAccounts.length === 0 && ebayAccounts.length === 0) {
      console.log("No accounts found");
      return NextResponse.json({ accounts: [] });
    }

    // Fetch Vinted conversations
    const vintedResults = await Promise.allSettled(
      vintedAccounts.map(async (account) => {
        console.log(`Fetching Vinted conversations for account: ${account.username}`);
        const params = new URLSearchParams({ page, per_page });

        const res = await fetch(`${VINTED_API_URL}/api/get-conversations?${params}`, {
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
        });

        if (!res.ok) {
          console.error(`Vinted API error for ${account.username}:`, res.status);
          throw new Error(`Vinted API error ${res.status}`);
        }

        const data = await res.json();
        console.log(`Vinted conversations for ${account.username}:`, data.conversations?.length || 0);

        return {
          accountId: account.accountId,
          username: account.username,
          platform: "vinted",
          conversations: (data.conversations ?? data ?? []).filter(
            (c) => c.opposite_user_name?.toLowerCase() !== "vinted"
          ),
          hasMore: (data.conversations ?? data ?? []).length === Number(per_page),
        };
      })
    );

    // Fetch eBay conversations
    const ebayResults = await Promise.allSettled(
      ebayAccounts.map(async (account) => {
        console.log(`Fetching eBay conversations for account: ${account.username}`);

        try {
          // Get valid token (will refresh if needed)
          const token = await getValidEbayToken(account.accountId);
          console.log(`Got valid token for eBay account: ${account.username}`);

          // eBay API supports pagination with limit and offset
          const limit = per_page;
          const offset = (Number(page) - 1) * Number(per_page);

          const url = `https://api.sandbox.ebay.com/commerce/message/v1/conversation?limit=${limit}&offset=${offset}`;
          console.log(`eBay API URL: ${url}`);

          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(10000),
          });

          console.log(`eBay API response status for ${account.username}:`, res.status);

          if (!res.ok) {
            const errorText = await res.text();
            console.error(`eBay API error for ${account.username}:`, errorText);
            throw new Error(`eBay API error ${res.status}: ${errorText}`);
          }

          const data = await res.json();
          console.log(`eBay API raw response for ${account.username}:`, JSON.stringify(data, null, 2));

          // Extract conversations from response
          const conversations = data.conversations || [];
          console.log(`eBay conversations for ${account.username}:`, conversations.length);
          console.log(`eBay pagination - total: ${data.total}, limit: ${data.limit}, offset: ${data.offset}`);

          // Transform eBay conversations to include all fields
          const transformedConversations = conversations.map(conv => ({
            // eBay specific fields
            conversationId: conv.conversationId,
            conversationStatus: conv.conversationStatus,
            conversationTitle: conv.conversationTitle,
            conversationType: conv.conversationType,
            createdDate: conv.createdDate,
            referenceId: conv.referenceId,
            referenceType: conv.referenceType,
            unreadCount: conv.unreadCount,

            // Latest message
            latestMessage: conv.latestMessage ? {
              messageId: conv.latestMessage.messageId,
              messageBody: conv.latestMessage.messageBody,
              subject: conv.latestMessage.subject,
              createdDate: conv.latestMessage.createdDate,
              senderUsername: conv.latestMessage.senderUsername,
              recipientUsername: conv.latestMessage.recipientUsername,
              readStatus: conv.latestMessage.readStatus,
              messageMedia: conv.latestMessage.messageMedia || [],
            } : null,

            // For compatibility with Vinted format
            id: conv.conversationId,
            msg_count: conv.unreadCount || 0,
            last_msg_at: conv.latestMessage?.createdDate || conv.createdDate,
            opposite_user_name: conv.latestMessage?.senderUsername || conv.latestMessage?.recipientUsername || 'Unknown',
          }));

          return {
            accountId: account.accountId,
            username: account.username,
            platform: "ebay",
            conversations: transformedConversations,
            hasMore: data.next ? true : false,
            pagination: {
              total: data.total,
              limit: data.limit,
              offset: data.offset,
              next: data.next,
              prev: data.prev,
            },
          };
        } catch (error) {
          console.error(`Error fetching eBay conversations for ${account.username}:`, error);
          throw error;
        }
      })
    );

    // Combine results
    const allAccounts = [
      ...vintedResults.filter((r) => r.status === "fulfilled").map((r) => r.value),
      ...ebayResults.filter((r) => r.status === "fulfilled").map((r) => r.value),
    ];

    const errors = [
      ...vintedResults.filter((r) => r.status === "rejected").map((r) => `Vinted: ${r.reason?.message}`),
      ...ebayResults.filter((r) => r.status === "rejected").map((r) => `eBay: ${r.reason?.message}`),
    ];

    console.log("Total accounts with conversations:", allAccounts.length);
    console.log("Total errors:", errors.length);

    return NextResponse.json({
      accounts: allAccounts,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("=== Messages fetch error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
