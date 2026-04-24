import { db } from "@/src/db/drizzle/index";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ linked: false }, { status: 400 });
  }

  const account = await db.query.connectedAccounts.findFirst({
    where: (ca) => eq(ca.platformUserId, userId),
  });

  return NextResponse.json({ linked: !!account });
}
