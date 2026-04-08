import { db } from "@/db/drizzle";
import { pendingSyncs, users } from "@/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: true, message: "Token manquant" },
        { status: 400 },
      );
    }

    // 1. Trouver le token en attente
    const [syncData] = await db
      .select()
      .from(pendingSyncs)
      .where(eq(pendingSyncs.token, token));

    if (!syncData) {
      return NextResponse.json(
        { error: true, message: "Token invalide ou expiré" },
        { status: 401 },
      );
    }

    // 2. Trouver l'utilisateur lié
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, syncData.userId));

    if (!user) {
      return NextResponse.json(
        { error: true, message: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        userId: user.id, // On s'assure que c'est bien userId ici pour le content.js
        domain: syncData.domain,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: true, message: "Erreur serveur" },
      { status: 500 },
    );
  }
}
