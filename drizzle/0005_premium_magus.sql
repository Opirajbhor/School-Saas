CREATE TYPE "public"."user_role" AS ENUM('admin', 'teacher');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'admin' NOT NULL;