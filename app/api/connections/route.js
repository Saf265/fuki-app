import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, users } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const DEFAULT_USER_ID = "default-user";

export async function GET(request) {
  try {
    // Ensure default user exists
    await db.insert(users).values({
      id: DEFAULT_USER_ID,
      name: "Utilisateur",
      email: "default@fuki.app",
    }).onConflictDoNothing();

    const userAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, DEFAULT_USER_ID));

    const vinted = userAccounts.filter((a) => a.platform === "vinted");
    const ebay = userAccounts.filter((a) => a.platform === "ebay");

    return NextResponse.json({
      connections: {
        vinted: vinted.map((a) => ({
          id: a.id,
          username: a.firstName,
          connectedAt: a.createdAt?.toLocaleDateString ? a.createdAt.toLocaleDateString("fr-FR") : null,
        })),
        ebay: ebay.map((a) => ({
          id: a.id,
          username: a.firstName || a.email,
          connectedAt: a.createdAt?.toLocaleDateString ? a.createdAt.toLocaleDateString("fr-FR") : null,
        })),
      },
    });
  } catch (error) {
    console.error("Connections fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await db
      .delete(connectedAccounts)
      .where(eq(connectedAccounts.id, id));

    return NextResponse.json({ success: true, message: "Compte supprimé" });
  } catch (error) {
    console.error("Connections delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
