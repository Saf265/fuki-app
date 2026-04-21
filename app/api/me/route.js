import { db } from "@/src/db/drizzle/index";
import { pendingSyncs, users } from "@/src/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow any origin for the extension to work easily
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Private-Network": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: true, message: "Token manquant" },
        { status: 400, headers: corsHeaders },
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
        { status: 401, headers: corsHeaders },
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
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        userId: user.id,
        domain: syncData.domain,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: true, message: "Erreur serveur" },
      { status: 500, headers: corsHeaders },
    );
  }
}
