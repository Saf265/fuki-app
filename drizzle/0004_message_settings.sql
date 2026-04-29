CREATE TABLE "message_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"favorite_reply_enabled" boolean DEFAULT false NOT NULL,
	"favorite_reply_message" text DEFAULT 'Bonjour ! Merci pour votre favori 😊 N''hésitez pas si vous avez des questions ou souhaitez faire une offre !' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "message_settings" ADD CONSTRAINT "message_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
