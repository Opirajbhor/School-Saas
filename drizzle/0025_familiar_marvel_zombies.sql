ALTER TABLE "subjects" DROP CONSTRAINT "subjects_institute_session_code_unique";--> statement-breakpoint
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_institute_session_name_unique";--> statement-breakpoint
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_session_id_academic_sessions_id_fk";
--> statement-breakpoint
DROP INDEX "subjects_session_idx";--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "session_id";--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institute_session_code_unique" UNIQUE("institute_id","code");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institute_session_name_unique" UNIQUE("institute_id","name");