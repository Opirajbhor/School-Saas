CREATE TABLE "exam_grade_scales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"min_mark" integer NOT NULL,
	"max_mark" integer NOT NULL,
	"GPA" numeric(4, 2) NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_grade_scales_institute_name_unique" UNIQUE("institute_id","name","max_mark","max_mark","GPA")
);
--> statement-breakpoint
CREATE TABLE "exam_mark_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_mark_types_institute_name_unique" UNIQUE("institute_id","name")
);
--> statement-breakpoint
ALTER TABLE "exam_grade_scales" ADD CONSTRAINT "exam_grade_scales_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_mark_types" ADD CONSTRAINT "exam_mark_types_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;