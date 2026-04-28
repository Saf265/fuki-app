import { db } from "@/src/db/drizzle/index";
import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";

// Currency mapping for Vinted domains
const VINTED_CURRENCY_MAP = {
  "vinted.fr": "EUR",
  "vinted.be": "EUR",
  "vinted.lu": "EUR",
  "vinted.es": "EUR",
  "vinted.it": "EUR",
  "vinted.pt": "EUR",
  "vinted.nl": "EUR",
  "vinted.de": "EUR",
  "vinted.at": "EUR",
  "vinted.com": "USD",
  "vinted.co.uk": "GBP",
  "vinted.pl": "PLN",
  "vinted.cz": "CZK",
  "vinted.lt": "EUR",
  "vinted.se": "SEK",
};

// Currency mapping for eBay marketplaces
const EBAY_CURRENCY_MAP = {
  "EBAY_US": "USD",
  "EBAY_GB": "GBP",
  "EBAY_DE": "EUR",
  "EBAY_FR": "EUR",
  "EBAY_IT": "EUR",
  "EBAY_ES": "EUR",
  "EBAY_NL": "EUR",
  "EBAY_BE": "EUR",
  "EBAY_AT": "EUR",
  "EBAY_CA": "CAD",
  "EBAY_AU": "AUD",
};

export async function GET(request) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const platform = searchParams.get("platform");

    if (!accountId || !platform) {
      return NextResponse.json({ error: "Missing accountId or platform" }, { status: 400 });
    }

    // Verify the account belongs to the user
    const account = await db.query.connectedAccounts.findFirst({
      where: (ca, { and, eq }) => and(
        eq(ca.id, accountId),
        eq(ca.userId, userId),
        eq(ca.platform, platform)
      ),
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    let sessionData;
    let currency;

    if (platform === "vinted") {
      // Fetch Vinted session
      const vintedSession = await db.query.vintedSessions.findFirst({
        where: (vs, { eq }) => eq(vs.connectedAccountId, accountId),
      });

      if (!vintedSession) {
        return NextResponse.json({ error: "Vinted session not found" }, { status: 404 });
      }

      // Determine currency from domain
      currency = VINTED_CURRENCY_MAP[vintedSession.domain] || "EUR";

      sessionData = {
        session_id: vintedSession.id,
        platform: "vinted",
        currency,
        domain: vintedSession.domain,
      };
    } else if (platform === "ebay") {
      // Fetch eBay session
      const ebaySession = await db.query.ebaySessions.findFirst({
        where: (es, { eq }) => eq(es.connectedAccountId, accountId),
      });

      if (!ebaySession) {
        return NextResponse.json({ error: "eBay session not found" }, { status: 404 });
      }

      // Determine currency from marketplaceId
      currency = EBAY_CURRENCY_MAP[ebaySession.marketplaceId] || "USD";

      sessionData = {
        session_id: ebaySession.id,
        platform: "ebay",
        currency,
        marketplaceId: ebaySession.marketplaceId,
      };
    } else {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Account session fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
