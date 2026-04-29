import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
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

    if (vintedAccounts.length === 0) {
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

    // Combine results
    const allAccounts = vintedResults.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const errors = vintedResults.filter((r) => r.status === "rejected").map((r) => `Vinted: ${r.reason?.message}`);

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
