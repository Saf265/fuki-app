import { db } from "@/src/db/drizzle/index";
import { connectedAccounts } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    const userAccounts = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.userId, userId));

    const vinted = userAccounts.filter((a) => a.platform === "vinted");

    return NextResponse.json({
      connections: {
        vinted: vinted.map((a) => ({
          id: a.id,
          username: a.username,
          connectedAt: a.createdAt?.toLocaleDateString?.("fr-FR") ?? null,
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
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Verify the account belongs to the user before deleting
    const account = await db.query.connectedAccounts.findFirst({
      where: (ca, { and, eq }) => and(
        eq(ca.id, id),
        eq(ca.userId, userId)
      ),
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Cascade supprime aussi vintedSessions
    await db.delete(connectedAccounts).where(eq(connectedAccounts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Connections delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
