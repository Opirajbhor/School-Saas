ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teacher_mobile_idx" ON "teachers" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "teacher_email_idx" ON "teachers" USING btree ("email");--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teacher_institute_email_unique" UNIQUE("institute_id","email");