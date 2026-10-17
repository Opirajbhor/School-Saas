CREATE TABLE "subject_mark_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"mark_type_id" uuid NOT NULL,
	"full_mark" integer NOT NULL,
	"pass_mark" integer NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_mark_template_unique" UNIQUE("subject_id","mark_type_id"),
	CONSTRAINT "subject_mark_template_full_mark_check" CHECK ("subject_mark_templates"."full_mark" >= 0),
	CONSTRAINT "subject_mark_template_pass_mark_check" CHECK ("subject_mark_templates"."pass_mark" >= 0 AND "subject_mark_templates"."pass_mark" <= "subject_mark_templates"."full_mark")
);
--> statement-breakpoint
ALTER TABLE "subject_mark_templates" ADD CONSTRAINT "subject_mark_templates_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_mark_templates" ADD CONSTRAINT "subject_mark_templates_mark_type_id_exam_mark_types_id_fk" FOREIGN KEY ("mark_type_id") REFERENCES "public"."exam_mark_types"("id") ON DELETE restrict ON UPDATE no action;