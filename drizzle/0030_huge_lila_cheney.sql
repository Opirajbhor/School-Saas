CREATE TYPE "public"."subject_type" AS ENUM('COMPULSORY', 'GROUP_BASED', 'OPTIONAL');--> statement-breakpoint
CREATE TABLE "subject_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"subject_type" "subject_type" DEFAULT 'COMPULSORY' NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_assign_unique" UNIQUE("session_id","class_id","group_id","subject_id")
);
--> statement-breakpoint
ALTER TABLE "classes" RENAME COLUMN "is_active" TO "status";--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;