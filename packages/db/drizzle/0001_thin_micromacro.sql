ALTER TABLE "offers" ADD COLUMN "categories" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "longitude" numeric(10, 7);