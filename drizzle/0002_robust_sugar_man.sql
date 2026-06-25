CREATE TABLE "institute_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"eiin" text NOT NULL,
	"institute_name_bangla" text NOT NULL,
	"institute_name_english" text NOT NULL,
	"admin_name_bangla" text NOT NULL,
	"admin_name_english" text NOT NULL,
	"admin_designation" text NOT NULL,
	"admin_phone" text NOT NULL,
	"division" text NOT NULL,
	"district" text NOT NULL,
	"upazila" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institute_profile_eiin_unique" UNIQUE("eiin")
);
--> statement-breakpoint
ALTER TABLE "institute_profile" ADD CONSTRAINT "institute_profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;