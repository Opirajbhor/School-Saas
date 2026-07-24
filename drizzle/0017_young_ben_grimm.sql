CREATE TYPE "public"."student_blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."student_gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'LEFT');--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"student_id" varchar(30) NOT NULL,
	"english_name" varchar(100) NOT NULL,
	"bangla_name" varchar(200),
	"gender" "student_gender" NOT NULL,
	"date_of_birth" date NOT NULL,
	"blood_group" "student_blood_group",
	"religion" varchar(50) NOT NULL,
	"nationality" varchar(50) DEFAULT 'Bangladeshi' NOT NULL,
	"mobile" varchar(11) NOT NULL,
	"email" varchar(255),
	"photo_url" text,
	"birth_certificate_no" varchar(50),
	"present_address" text NOT NULL,
	"permanent_address" text NOT NULL,
	"status" "student_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_unique_per_institute" UNIQUE("institute_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;