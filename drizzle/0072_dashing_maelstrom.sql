ALTER TABLE "exams" ALTER COLUMN "institute_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "exams" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "exams" DROP COLUMN "publish_date";