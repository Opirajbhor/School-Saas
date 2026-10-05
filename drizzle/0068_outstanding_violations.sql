ALTER TABLE "classes" DROP CONSTRAINT "classes_institute_session_name_unique";--> statement-breakpoint
ALTER TABLE "classes" DROP CONSTRAINT "classes_session_id_academic_sessions_id_fk";
--> statement-breakpoint
DROP INDEX "classes_session_idx";--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "institute_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "session_id";--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_institute_session_name_unique" UNIQUE("institute_id","name");