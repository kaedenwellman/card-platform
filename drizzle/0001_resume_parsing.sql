CREATE TABLE "resume_parses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ok" boolean DEFAULT false NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "resume_text" text;--> statement-breakpoint
ALTER TABLE "resume_parses" ADD CONSTRAINT "resume_parses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resume_parses_user_idx" ON "resume_parses" USING btree ("user_id","created_at");