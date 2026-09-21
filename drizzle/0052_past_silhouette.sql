DROP INDEX "audit_logs_institute_created_idx";--> statement-breakpoint
DROP INDEX "audit_logs_user_created_idx";--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
CREATE INDEX "audit_logs_institute_created_idx" ON "audit_logs" USING btree ("institute_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs" USING btree ("user_id","created_at" DESC NULLS LAST);