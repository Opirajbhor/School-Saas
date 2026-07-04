ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_institute_year_unique" UNIQUE("institute_id","year");--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_institute_session_name_unique" UNIQUE("institute_id","session_id","name");--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_class_name_unique" UNIQUE("class_id","name");