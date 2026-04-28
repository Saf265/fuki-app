import { db } from "@/src/db/drizzle/index";
import { publications } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rows = await db.query.publications.findMany({
      where: eq(publications.userId, session.user.id),
      with: { accounts: true },
      orderBy: desc(publications.createdAt),
    });

    return NextResponse.json({ publications: rows });
  } catch (error) {
    console.error("Listings fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
