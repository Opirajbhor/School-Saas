CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_institute_name_unique" UNIQUE("institute_id","name")
);
--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "groups_institute_id_idx" ON "groups" USING btree ("institute_id");