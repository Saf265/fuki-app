import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { db } from "@/src/db/drizzle/index";
import { connectedAccounts } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, session.user.id));

    const connections = {
      vinted: [],
      ebay: []
    };

    userAccounts.forEach(account => {
      const formattedAccount = {
        id: account.id,
        username: account.platformUserId || account.firstName || "Utilisateur",
        connectedAt: new Date(account.createdAt || Date.now()).toLocaleDateString("fr-FR"),
        platform: account.platform
      };

      if (account.platform === "vinted") {
        connections.vinted.push(formattedAccount);
      } else if (account.platform === "ebay") {
        connections.ebay.push(formattedAccount);
      }
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
