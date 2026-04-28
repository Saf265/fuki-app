DROP TABLE IF EXISTS "publication_accounts";--> statement-breakpoint
DROP TABLE IF EXISTS "publications";--> statement-breakpoint
CREATE TABLE "publications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "job_id" text,
  "status" text NOT NULL DEFAULT 'pending',
  "title" text NOT NULL,
  "description" text,
  "brand" text,
  "brand_id" integer,
  "category_path" text,
  "category_id" integer,
  "size" text,
  "size_id" integer,
  "condition" text,
  "status_id" integer,
  "colors" text,
  "color_ids" jsonb,
  "parcel_size" text,
  "parcel_size_id" integer,
  "isbn" text,
  "is_unisex" boolean DEFAULT false,
  "generated_covers" jsonb,
  "price" real NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "pub_userId_idx" ON "publications" ("user_id");--> statement-breakpoint
CREATE INDEX "pub_status_idx" ON "publications" ("status");--> statement-breakpoint
CREATE TABLE "publication_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "publication_id" text NOT NULL REFERENCES "publications"("id") ON DELETE CASCADE,
  "connected_account_id" text NOT NULL REFERENCES "connected_accounts"("id") ON DELETE CASCADE,
  "platform" text NOT NULL,
  "currency" text NOT NULL,
  "sku" text,
  "status" text NOT NULL DEFAULT 'pending',
  "platform_listing_id" text,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "pa_publicationId_idx" ON "publication_accounts" ("publication_id");--> statement-breakpoint
CREATE INDEX "pa_connectedAccountId_idx" ON "publication_accounts" ("connected_account_id");
