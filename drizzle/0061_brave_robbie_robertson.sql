CREATE TABLE "exam_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_classes_exam_class_unique" UNIQUE("exam_id","class_id")
);
--> statement-breakpoint
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_classes_exam_idx" ON "exam_classes" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_classes_class_idx" ON "exam_classes" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "exam_classes_institute_idx" ON "exam_classes" USING btree ("institute_id");