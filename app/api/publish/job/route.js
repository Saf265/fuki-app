import { db } from "@/src/db/drizzle/index";
import { connectedAccounts, publicationAccounts, publications } from "@/src/db/drizzle/schema";
import { auth } from "@/src/lib/auth";
import { PublishPayloadSchema } from "@/src/trigger/publish-product";
import { tasks } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    const parsed = PublishPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { accounts_selected, global_products } = parsed.data;

    console.log("=== Triggering publish job ===");
    console.log("User:", session.user.id);
    console.log("Platforms:", accounts_selected.map((a) => a.platform));
    console.log("Title:", global_products.title);

    // ─── 1. Save publication in DB ────────────────────────────────────────────
    const publicationId = nanoid();

    await db.insert(publications).values({
      id: publicationId,
      userId: session.user.id,
      status: "pending",
      title: global_products.title,
      description: global_products.description ?? null,
      brand: global_products.brand ?? null,
      brandId: global_products.brand_id ?? null,
      categoryPath: global_products.category_path ?? null,
      categoryId: global_products.category_id ?? null,
      size: global_products.size ?? null,
      sizeId: global_products.size_id ?? null,
      condition: global_products.condition ?? null,
      statusId: global_products.status_id ?? null,
      colors: global_products.colors ?? null,
      colorIds: global_products.color_ids ?? null,
      parcelSize: global_products.parcel_size ?? null,
      parcelSizeId: global_products.parcel_size_id ?? null,
      isbn: global_products.isbn ?? null,
      isUnisex: global_products.is_unisex ?? false,
      generatedCovers: global_products.generated_covers ?? null,
      price: global_products.price,
    });

    // ─── 2. Save one row per account ─────────────────────────────────────────
    for (const acc of accounts_selected) {
      // Find the connectedAccount by session_id
      const connectedAccount = await db.query.connectedAccounts.findFirst({
        where: (ca, { eq: eqFn }) => {
          if (acc.platform === "vinted") {
            return eqFn(ca.id,
              db.select({ id: connectedAccounts.id })
                .from(connectedAccounts)
                .where(eq(connectedAccounts.id, acc.session_id))
                .limit(1)
            );
          }
          return eqFn(ca.id, acc.session_id);
        },
      });

      // Get connectedAccountId from the session
      let connectedAccountId = null;
      if (acc.platform === "vinted") {
        const vs = await db.query.vintedSessions.findFirst({
          where: (s, { eq: eqFn }) => eqFn(s.id, acc.session_id),
        });
        connectedAccountId = vs?.connectedAccountId ?? null;
      }

      if (!connectedAccountId) {
        console.warn(`Could not find connectedAccountId for session ${acc.session_id}`);
        continue;
      }

      await db.insert(publicationAccounts).values({
        id: nanoid(),
        publicationId,
        connectedAccountId,
        platform: acc.platform,
        currency: acc.currency,
        sku: acc.sku ?? null,
        status: "pending",
      });
    }

    // ─── 3. Trigger background job ───────────────────────────────────────────
    const handle = await tasks.trigger("publish-product", {
      ...parsed.data,
      publicationId, // Pass the DB id so the job can update status
    });

    // ─── 4. Update publication with jobId ────────────────────────────────────
    await db.update(publications)
      .set({ jobId: handle.id, status: "running" })
      .where(eq(publications.id, publicationId));

    console.log("✅ Job triggered:", handle.id, "| Publication:", publicationId);

    return NextResponse.json({
      success: true,
      jobId: handle.id,
      publicationId,
    });
  } catch (error) {
    console.error("Failed to trigger publish job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
