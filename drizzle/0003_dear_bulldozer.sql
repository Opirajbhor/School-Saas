ALTER TABLE "institute_profile" DROP CONSTRAINT "institute_profile_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "institute_profile" ADD CONSTRAINT "institute_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;