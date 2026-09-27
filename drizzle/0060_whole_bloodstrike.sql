ALTER TABLE "exams" ADD COLUMN "start_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "end_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "publish_date" timestamp with time zone;