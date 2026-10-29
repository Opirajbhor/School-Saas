CREATE TYPE "public"."mark_workflow" AS ENUM('OPEN', 'FINALIZED', 'PUBLISHED');--> statement-breakpoint
CREATE TABLE "exam_mark_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"mark_type_id" uuid NOT NULL,
	"old_mark" integer,
	"new_mark" integer,
	"old_absent" boolean,
	"new_absent" boolean,
	"edited_by_id" text NOT NULL,
	"edited_by_role" text NOT NULL,
	"edit_request_id" uuid,
	"approved_by_id" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "mark_workflow" "mark_workflow" DEFAULT 'OPEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "finalized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "finalized_by_id" text;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "published_by_id" text;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_mark_type_id_exam_mark_types_id_fk" FOREIGN KEY ("mark_type_id") REFERENCES "public"."exam_mark_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_edited_by_id_user_id_fk" FOREIGN KEY ("edited_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_edit_request_id_exam_mark_edit_requests_id_fk" FOREIGN KEY ("edit_request_id") REFERENCES "public"."exam_mark_edit_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_corrections" ADD CONSTRAINT "exam_mark_corrections_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_mark_corrections_institute_idx" ON "exam_mark_corrections" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX "exam_mark_corrections_scope_idx" ON "exam_mark_corrections" USING btree ("exam_id","enrollment_id");--> statement-breakpoint
CREATE INDEX "exam_mark_corrections_request_idx" ON "exam_mark_corrections" USING btree ("edit_request_id");--> statement-breakpoint
CREATE INDEX "exam_mark_corrections_created_idx" ON "exam_mark_corrections" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_finalized_by_id_user_id_fk" FOREIGN KEY ("finalized_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_published_by_id_user_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;