import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, vintedSessions } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const DEFAULT_USER_ID = "default-user";
const VINTED_API_URL = process.env.VINTED_API_URL;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const per_page = searchParams.get("per_page") || "10";

  try {
    // Récupère tous les comptes Vinted de l'user avec leur session
    const accounts = await db
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
      .where(eq(connectedAccounts.userId, DEFAULT_USER_ID));

    if (accounts.length === 0) {
      return NextResponse.json({ conversations: [], accounts: [] });
    }

    // Fetch conversations pour tous les comptes en parallèle
    const results = await Promise.allSettled(
      accounts.map(async (account) => {
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

        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        return {
          accountId: account.accountId,
          username: account.username,
          conversations: (data.conversations ?? data ?? []).filter(
            (c) => c.opposite_user_name?.toLowerCase() !== "vinted"
          ),
          hasMore: (data.conversations ?? data ?? []).length === Number(per_page),
        };
      })
    );

    const accounts_with_convs = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason?.message);

    return NextResponse.json({
      accounts: accounts_with_convs,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
