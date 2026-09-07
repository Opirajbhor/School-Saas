ALTER TABLE "subjects" ADD COLUMN "subject_type" "subject_type" DEFAULT 'COMPULSORY' NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "is_optional" boolean DEFAULT false NOT NULL;