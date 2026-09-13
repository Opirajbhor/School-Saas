ALTER TABLE "students" DROP CONSTRAINT "students_group_id_group_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "group_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_group_id_group_classes_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_classes"("id") ON DELETE no action ON UPDATE no action;