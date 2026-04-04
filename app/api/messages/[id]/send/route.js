import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { db } from "@/src/db/drizzle/index";
import { connectedAccounts } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getValidEbayToken } from "@/src/lib/ebay";

export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { id: messageId } = await params;
    const { text } = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. We need to find which account this message belongs to.
    // NOTE: In a real app, you would store the relationship between messageId and accountId.
    // For now, let's try finding the account this user has connected that is eBay.
    const ebayAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, session.user.id))
      .then(rows => rows.filter(r => r.platform === "ebay"));

    if (ebayAccounts.length === 0) {
      return NextResponse.json({ error: "No eBay account connected" }, { status: 404 });
    }

    // Since we don't know which account sent this original message (if they have multiple), 
    // we take the first as a fallback, or better: 
    // real implementations should have an ID format like `accountID:messageID`.
    const account = ebayAccounts[0]; 

    // MOCK: If it's a mock message, just return success
    if (messageId.startsWith('mock-')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return NextResponse.json({ success: true });
    }

    const accessToken = await getValidEbayToken(account.id);

    const body = {
      body: text
    };

    const res = await fetch(`https://apiz.sandbox.ebay.com/sell/messaging/v1/member_message/${messageId}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
       return NextResponse.json({ success: true });
    } else {
        const errorText = await res.text();
        console.error("eBay reply error:", errorText);
        return NextResponse.json({ error: errorText }, { status: 400 });
    }

  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
