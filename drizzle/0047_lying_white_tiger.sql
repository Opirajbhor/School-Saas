ALTER TABLE "classes" DROP CONSTRAINT "classes_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "sections" DROP CONSTRAINT "sections_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "sections" DROP COLUMN "user_id";