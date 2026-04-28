CREATE TABLE "publication_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"publication_id" text NOT NULL,
	"connected_account_id" text NOT NULL,
	"platform" text NOT NULL,
	"currency" text NOT NULL,
	"sku" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"platform_listing_id" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"brand" text,
	"brand_id" text,
	"category_path" text,
	"category_id" text,
	"size" text,
	"size_id" text,
	"condition" text,
	"status_id" text,
	"colors" text,
	"color_ids" text,
	"parcel_size" text,
	"parcel_size_id" text,
	"isbn" text,
	"is_unisex" boolean DEFAULT false,
	"generated_covers" text,
	"price" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publication_accounts" ADD CONSTRAINT "publication_accounts_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_accounts" ADD CONSTRAINT "publication_accounts_connected_account_id_connected_accounts_id_fk" FOREIGN KEY ("connected_account_id") REFERENCES "public"."connected_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pa_publicationId_idx" ON "publication_accounts" USING btree ("publication_id");--> statement-breakpoint
CREATE INDEX "pa_connectedAccountId_idx" ON "publication_accounts" USING btree ("connected_account_id");--> statement-breakpoint
CREATE INDEX "pub_userId_idx" ON "publications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pub_status_idx" ON "publications" USING btree ("status");