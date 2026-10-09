ALTER TABLE "subject_assignments" ADD COLUMN "subject_type" "subject_type" DEFAULT 'COMPULSORY' NOT NULL;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD COLUMN "is_optional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD COLUMN "is_religion" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "subject_type";--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "is_optional";--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "is_religion";