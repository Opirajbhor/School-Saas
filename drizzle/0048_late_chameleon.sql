ALTER TABLE "institute_profile" DROP CONSTRAINT "institute_profile_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_institute_id_institute_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_group_id_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "subject_assignments" DROP CONSTRAINT "subject_assignments_institute_id_institute_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "subject_assignments" DROP CONSTRAINT "subject_assignments_session_id_academic_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "subject_assignments" DROP CONSTRAINT "subject_assignments_group_id_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "subject_assignments" DROP CONSTRAINT "subject_assignments_subject_id_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "section_class_teachers" DROP CONSTRAINT "section_class_teachers_institute_id_institute_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "section_class_teachers" DROP CONSTRAINT "section_class_teachers_class_id_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "section_class_teachers" DROP CONSTRAINT "section_class_teachers_section_id_sections_id_fk";
--> statement-breakpoint
ALTER TABLE "section_class_teachers" DROP CONSTRAINT "section_class_teachers_teacher_id_teachers_id_fk";
--> statement-breakpoint
ALTER TABLE "section_class_teachers" DROP CONSTRAINT "section_class_teachers_session_id_academic_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_institute_id_institute_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "institute_profile" ADD COLUMN "institute_logo" text;--> statement-breakpoint
ALTER TABLE "institute_profile" ADD CONSTRAINT "institute_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_student_id_institute_profile_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section_class_teachers" ADD CONSTRAINT "section_class_teachers_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section_class_teachers" ADD CONSTRAINT "section_class_teachers_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section_class_teachers" ADD CONSTRAINT "section_class_teachers_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section_class_teachers" ADD CONSTRAINT "section_class_teachers_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section_class_teachers" ADD CONSTRAINT "section_class_teachers_session_id_academic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."academic_sessions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "academic_sessions" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "institute_profile" DROP COLUMN "admin_name_bangla";--> statement-breakpoint
ALTER TABLE "institute_profile" DROP COLUMN "admin_name_english";--> statement-breakpoint
ALTER TABLE "institute_profile" DROP COLUMN "admin_designation";