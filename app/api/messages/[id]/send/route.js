import { NextResponse } from "next/server";
import { db } from "@/src/db/drizzle/index";
import { connectedAccounts } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { getValidEbayToken } from "@/src/lib/ebay";

const DEFAULT_USER_ID = "default-user";

export async function POST(request, { params }) {
  try {
    const { id: messageId } = await params;
    const { text } = await request.json();

    // 1. We need to find which account this message belongs to.
    const ebayAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, DEFAULT_USER_ID))
      .then(rows => rows.filter(r => r.platform === "ebay"));

    if (ebayAccounts.length === 0) {
      return NextResponse.json({ error: "Aucun compte eBay connecté" }, { status: 404 });
    }

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
