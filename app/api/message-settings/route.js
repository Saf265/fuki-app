import { db } from "@/src/db/drizzle/index";
import { messageSettings } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    let settings = await db.query.messageSettings.findFirst({
      where: (ms, { eq }) => eq(ms.userId, userId),
    });

    // Auto-create default settings if none exist
    if (!settings) {
      const id = nanoid();
      await db.insert(messageSettings).values({ id, userId });
      settings = await db.query.messageSettings.findFirst({
        where: (ms, { eq }) => eq(ms.userId, userId),
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("message-settings GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { favoriteReplyEnabled, favoriteReplyMessage } = body;

    // Validate
    if (typeof favoriteReplyEnabled !== "boolean") {
      return NextResponse.json({ error: "favoriteReplyEnabled must be a boolean" }, { status: 400 });
    }
    if (typeof favoriteReplyMessage !== "string" || favoriteReplyMessage.trim().length === 0) {
      return NextResponse.json({ error: "favoriteReplyMessage must be a non-empty string" }, { status: 400 });
    }
    if (favoriteReplyMessage.length > 1000) {
      return NextResponse.json({ error: "Message too long (max 1000 chars)" }, { status: 400 });
    }

    const existing = await db.query.messageSettings.findFirst({
      where: (ms, { eq }) => eq(ms.userId, userId),
    });

    if (existing) {
      await db.update(messageSettings)
        .set({
          favoriteReplyEnabled,
          favoriteReplyMessage: favoriteReplyMessage.trim(),
          updatedAt: new Date(),
        })
        .where(eq(messageSettings.userId, userId));
    } else {
      await db.insert(messageSettings).values({
        id: nanoid(),
        userId,
        favoriteReplyEnabled,
        favoriteReplyMessage: favoriteReplyMessage.trim(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("message-settings PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
