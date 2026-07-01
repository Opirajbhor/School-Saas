CREATE TABLE "academic_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"user_id" text,
	"year" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;