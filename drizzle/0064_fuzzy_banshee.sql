ALTER TABLE "academic_sessions" DROP CONSTRAINT "academic_sessions_institute_year_unique";--> statement-breakpoint
ALTER TABLE "academic_sessions" DROP CONSTRAINT "academic_sessions_institute_id_institute_profile_id_fk";
--> statement-breakpoint
DROP INDEX "academic_sessions_institute_idx";--> statement-breakpoint
ALTER TABLE "academic_sessions" DROP COLUMN "institute_id";--> statement-breakpoint
ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_institute_year_unique" UNIQUE("year");