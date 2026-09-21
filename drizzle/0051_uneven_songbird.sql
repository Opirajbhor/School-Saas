CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'STATUS_CHANGE', 'DELETE', 'LOGIN');--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('STUDENT', 'TEACHER', 'CLASS', 'SECTION', 'GROUP', 'SUBJECT', 'SUBJECT_ASSIGNMENT', 'ENROLLMENT', 'EXAM', 'EXAM_SUBJECT', 'MARK', 'RESULT');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity" "audit_entity" NOT NULL,
	"entity_id" uuid,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_institute_created_idx" ON "audit_logs" USING btree ("institute_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs" USING btree ("user_id","created_at");