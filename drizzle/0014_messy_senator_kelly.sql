CREATE INDEX "academic_sessions_institute_idx" ON "academic_sessions" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX "classes_institute_idx" ON "classes" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX "classes_session_idx" ON "classes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sections_institute_idx" ON "sections" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX "sections_session_idx" ON "sections" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "sections_class_idx" ON "sections" USING btree ("class_id");