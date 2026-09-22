ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."audit_action";--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATED', 'UPDATED', 'STATUS_CHANGED', 'DELETED', 'LOGGED_IN');--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE "public"."audit_action" USING "action"::"public"."audit_action";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "entity" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."audit_entity";--> statement-breakpoint
CREATE TYPE "public"."audit_entity" AS ENUM('SESSION', 'STUDENT', 'TEACHER', 'CLASS', 'SECTION', 'GROUP', 'SUBJECT', 'ASSIGNED_SUBJECT', 'EXAM', 'EXAM_SUBJECT', 'MARK', 'RESULT');--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "entity" SET DATA TYPE "public"."audit_entity" USING "entity"::"public"."audit_entity";