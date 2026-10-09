ALTER TABLE "subject_assignments" DROP CONSTRAINT "subject_assign_unique";--> statement-breakpoint
ALTER TABLE "subject_assignments" DROP CONSTRAINT "subject_assignments_session_id_academic_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "subject_assignments" ALTER COLUMN "institute_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subject_assignments" DROP COLUMN "session_id";--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "is_religion";--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "religion";--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assign_unique" UNIQUE("class_id","group_id","subject_id");