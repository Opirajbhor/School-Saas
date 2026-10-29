ALTER TABLE "subjects" ADD COLUMN "combine_with" uuid;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "combine_label" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_combine_with_subjects_id_fk" FOREIGN KEY ("combine_with") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;