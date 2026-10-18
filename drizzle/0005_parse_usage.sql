ALTER TABLE "resume_parses" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "resume_parses" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "resume_parses" ADD COLUMN "model" text;