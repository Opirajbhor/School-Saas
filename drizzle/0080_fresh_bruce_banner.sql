CREATE TABLE "exam_marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"mark_type_id" uuid NOT NULL,
	"mark" integer NOT NULL,
	"absent" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_marks_exam_enrollment_subject_marktype_unique" UNIQUE("exam_id","enrollment_id","subject_id","mark_type_id")
);
--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_mark_type_id_exam_mark_types_id_fk" FOREIGN KEY ("mark_type_id") REFERENCES "public"."exam_mark_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_marks_institute_idx" ON "exam_marks" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX "exam_marks_exam_idx" ON "exam_marks" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_marks_enrollment_idx" ON "exam_marks" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "exam_marks_exam_subject_idx" ON "exam_marks" USING btree ("exam_id","subject_id");