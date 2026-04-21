import { NextResponse } from "next/server";
import { db } from "@/src/db/drizzle/index";
import { connectedAccounts } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { getValidEbayToken } from "@/src/lib/ebay";

const DEFAULT_USER_ID = "default-user";

export async function GET(request) {
  try {
    // Fetch all connected eBay accounts for default user
    const ebayAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, DEFAULT_USER_ID))
      .then(rows => rows.filter(r => r.platform === "ebay"));

    let allConversations = [];

    // Aggregate messages from each eBay account
    for (const account of ebayAccounts) {
      try {
        const accessToken = await getValidEbayToken(account.id);
        
        const msgsRes = await fetch(
          "https://apiz.sandbox.ebay.com/sell/messaging/v1/member_message?limit=20",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (msgsRes.ok) {
          const data = await msgsRes.json();
          const mapped = (data.memberMessages || []).map(m => ({
            id: m.messageId,
            platform: "ebay",
            accountName: account.firstName || account.email || "Compte eBay",
            name: m.fromDisplayValue || "Anonyme",
            lastMessage: m.subject || "Sans sujet",
            lastTime: new Date(m.creationDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            avatar: null,
            messages: [
              {
                id: m.messageId,
                text: m.body || m.subject,
                sender: 'them',
                time: new Date(m.creationDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                status: 'sent'
              }
            ]
          }));
          allConversations = [...allConversations, ...mapped];
        }
      } catch (err) {
        console.warn(`Error fetching eBay messages for ${account.id}:`, err.message);
      }
    }

    // Mock some data if none exist (for UI demo)
    if (allConversations.length === 0) {
       allConversations = [
        {
          id: 'mock-1',
          platform: 'vinted',
          accountName: 'Sarah Vntd',
          name: 'Lucas Dupont',
          lastMessage: 'Est-ce que l\'article est encore disponible ?',
          lastTime: '10:45',
          avatar: null,
          messages: [
            { id: 1, text: 'Bonjour !', sender: 'them', time: '10:40' },
            { id: 2, text: 'Est-ce que l\'article est encore disponible ?', sender: 'them', time: '10:45' }
          ]
        },
        {
            id: 'mock-2',
            platform: 'ebay',
            accountName: 'Pro Seller',
            name: 'Jean-Pierre',
            lastMessage: 'Veuillez m\'envoyer une offre pour cet objet.',
            lastTime: 'Hier',
            avatar: null,
            messages: [
              { id: 1, text: 'Bonjour, je suis intéressé.', sender: 'them', time: 'Hier' },
              { id: 2, text: 'Veuillez m\'envoyer une offre pour cet objet.', sender: 'them', time: 'Hier' }
            ]
          }
      ];
    }

    return NextResponse.json({ conversations: allConversations });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
