CREATE TYPE "public"."mark_entry_status" AS ENUM('DRAFT', 'SUBMITTED');--> statement-breakpoint
ALTER TABLE "exam_marks" ADD COLUMN "entry_status" "mark_entry_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
CREATE INDEX "exam_marks_entry_status_idx" ON "exam_marks" USING btree ("entry_status");