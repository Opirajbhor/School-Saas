ALTER TABLE "subjects" RENAME COLUMN "is_active" TO "status";--> statement-breakpoint
ALTER TABLE "subjects" DROP CONSTRAINT "subject_institute_session_name_unique";--> statement-breakpoint
DROP INDEX "subjects_institute_idx";--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "short_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "is_religion" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "religion" "religion";--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institute_session_code_unique" UNIQUE("institute_id","session_id","code");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institute_session_name_unique" UNIQUE("institute_id","session_id","name");