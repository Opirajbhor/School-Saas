ALTER TABLE "subject_assignments" ALTER COLUMN "subject_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subject_assignments" ALTER COLUMN "subject_type" SET DEFAULT 'COMPULSORY'::text;--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "subject_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "subject_type" SET DEFAULT 'COMPULSORY'::text;--> statement-breakpoint
DROP TYPE "public"."subject_type";--> statement-breakpoint
CREATE TYPE "public"."subject_type" AS ENUM('COMPULSORY', 'GROUP_BASED', 'RELIGION');--> statement-breakpoint
ALTER TABLE "subject_assignments" ALTER COLUMN "subject_type" SET DEFAULT 'COMPULSORY'::"public"."subject_type";--> statement-breakpoint
ALTER TABLE "subject_assignments" ALTER COLUMN "subject_type" SET DATA TYPE "public"."subject_type" USING "subject_type"::"public"."subject_type";--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "subject_type" SET DEFAULT 'COMPULSORY'::"public"."subject_type";--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "subject_type" SET DATA TYPE "public"."subject_type" USING "subject_type"::"public"."subject_type";