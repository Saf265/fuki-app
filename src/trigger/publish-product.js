import { db } from "@/src/db/drizzle/index";
import { publications } from "@/src/db/drizzle/schema";
import { getCurrencyFromDomain, getCurrencyFromMarketplace } from "@/src/lib/currency";
import { logger, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const AccountSelectedSchema = z.object({
  session_id: z.string(),
  platform: z.enum(["vinted", "ebay"]),
  currency: z.string(),
  sku: z.string().optional(),
});

export const GlobalProductSchema = z.object({
  title: z.string(),
  description: z.string(),
  brand: z.string().optional().nullable(),
  brand_id: z.number().optional().nullable(),
  category_path: z.string().optional().nullable(),
  category_id: z.number().optional().nullable(),
  size: z.string().optional().nullable(),
  size_id: z.number().optional().nullable(),
  condition: z.string().optional().nullable(),
  status_id: z.number().optional().nullable(),
  colors: z.string().optional().nullable(),
  color_ids: z.array(z.number().int()).optional().nullable(),
  parcel_size: z.string().optional().nullable(),
  parcel_size_id: z.number().int().optional().nullable(),
  isbn: z.string().optional().nullable(),
  is_unisex: z.boolean().default(false),
  generated_covers: z.array(z.string()).optional().nullable(),
  price: z.number(),
});

export const PublishPayloadSchema = z.object({
  publicationId: z.string().optional(), // Added by API route
  accounts_selected: z.array(AccountSelectedSchema).min(1),
  global_products: GlobalProductSchema,
});

// ─── Task ─────────────────────────────────────────────────────────────────────

export const publishProductTask = task({
  id: "publish-product",
  maxDuration: 300,
  retry: { maxAttempts: 3 },

  run: async (payload) => {
    const parsed = PublishPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid payload", { errors: parsed.error.flatten() });
      throw new Error("Invalid publish payload");
    }

    const { publicationId, accounts_selected, global_products } = parsed.data;

    logger.info("🚀 Starting publish job", {
      publicationId,
      title: global_products.title,
      platforms: accounts_selected.map((a) => a.platform),
    });

    // Mark as running
    if (publicationId) {
      await db.update(publications)
        .set({ status: "running" })
        .where(eq(publications.id, publicationId));
    }

    // ─── Build formatted payloads array ──────────────────────────────────────
    const formattedPayloads = [];

    for (const account of accounts_selected) {
      if (account.platform === "vinted") {
        const vintedSession = await db.query.vintedSessions.findFirst({
          where: (vs, { eq: eqFn }) => eqFn(vs.id, account.session_id),
        });

        if (!vintedSession) {
          logger.error("Vinted session not found", { session_id: account.session_id });
          continue;
        }

        const connectedAccount = await db.query.connectedAccounts.findFirst({
          where: (ca, { eq: eqFn }) => eqFn(ca.id, vintedSession.connectedAccountId),
        });

        formattedPayloads.push({
          vinted_session: {
            domain: vintedSession.domain,
            access_token: vintedSession.accessToken,
            refresh_token: vintedSession.refreshToken,
            user_id: connectedAccount?.platformUserId ?? null,
            warmed_at: vintedSession.warmedAt,
            warmed_up: vintedSession.warmedUp,
            anon_id: vintedSession.anonId,
            csrf_token: vintedSession.csrfToken,
            user_agent: vintedSession.userAgent,
            cookie_header: vintedSession.cookieHeader,
          },
          product_data: {
            title: global_products.title,
            description: global_products.description,
            brand: global_products.brand,
            brand_id: global_products.brand_id,
            category_id: global_products.category_id,
            size_id: global_products.size_id,
            status_id: global_products.status_id,
            color_ids: global_products.color_ids,
            package_size_id: global_products.parcel_size_id,
            isbn: global_products.isbn,
            is_unisex: global_products.is_unisex,
            generated_covers: global_products.generated_covers,
            price: global_products.price,
            currency: getCurrencyFromDomain(vintedSession.domain),
          },
        });

      } else if (account.platform === "ebay") {
        const ebaySession = await db.query.ebaySessions.findFirst({
          where: (es, { eq: eqFn }) => eqFn(es.id, account.session_id),
        });

        if (!ebaySession) {
          logger.error("eBay session not found", { session_id: account.session_id });
          continue;
        }

        formattedPayloads.push({
          ebay_session: {
            access_token: ebaySession.accessToken,
            refresh_token: ebaySession.refreshToken,
            marketplace_id: ebaySession.marketplaceId,
            payment_policy_id: ebaySession.paymentPolicyId,
            fulfillment_policy_id: ebaySession.fulfillmentPolicyId,
            return_policy_id: ebaySession.returnPolicyId,
          },
          product_data: {
            title: global_products.title,
            description: global_products.description,
            brand: global_products.brand,
            brand_id: global_products.brand_id,
            category_path: global_products.category_path,
            category_id: global_products.category_id,
            size_id: global_products.size_id,
            condition: global_products.condition,
            status_id: global_products.status_id,
            colors: global_products.colors,
            color_ids: global_products.color_ids,
            parcel_size: global_products.parcel_size,
            package_size_id: global_products.parcel_size_id,
            isbn: global_products.isbn,
            is_unisex: global_products.is_unisex,
            generated_covers: global_products.generated_covers,
            price: global_products.price,
            currency: getCurrencyFromMarketplace(ebaySession.marketplaceId),
            sku: account.sku,
          },
        });
      }
    }

    // ─── Log the final array ──────────────────────────────────────────────────
    console.log("=== FORMATTED PAYLOADS ===");
    console.log(JSON.stringify(formattedPayloads, null, 2));
    logger.info("Formatted payloads", { count: formattedPayloads.length });

    // ─── TODO: send each payload to the respective API ────────────────────────
    // for (const p of formattedPayloads) {
    //   if (p.vinted_session) await publishToVinted(p);
    //   if (p.ebay_session)   await publishToEbay(p);
    // }

    // ─── Update DB status ─────────────────────────────────────────────────────
    if (publicationId) {
      await db.update(publications)
        .set({ status: "pending" }) // Will be "success" once real API calls are done
        .where(eq(publications.id, publicationId));
    }

    return { success: true, payloads: formattedPayloads };
  },
});
