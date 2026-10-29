CREATE TYPE "public"."mark_edit_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "exam_mark_edit_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "mark_edit_request_status" DEFAULT 'PENDING' NOT NULL,
	"resolved_by_id" uuid,
	"resolution_note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "exam_mark_edit_requests" ADD CONSTRAINT "exam_mark_edit_requests_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_edit_requests" ADD CONSTRAINT "exam_mark_edit_requests_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_edit_requests" ADD CONSTRAINT "exam_mark_edit_requests_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_edit_requests" ADD CONSTRAINT "exam_mark_edit_requests_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_edit_requests" ADD CONSTRAINT "exam_mark_edit_requests_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_edit_requests" ADD CONSTRAINT "exam_mark_edit_requests_requested_by_id_teachers_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."teachers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_edit_requests" ADD CONSTRAINT "exam_mark_edit_requests_resolved_by_id_teachers_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_mark_edit_requests_institute_idx" ON "exam_mark_edit_requests" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX "exam_mark_edit_requests_scope_idx" ON "exam_mark_edit_requests" USING btree ("exam_id","section_id","subject_id");--> statement-breakpoint
CREATE INDEX "exam_mark_edit_requests_status_idx" ON "exam_mark_edit_requests" USING btree ("status");--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exams_session_idx" ON "exams" USING btree ("session_id");