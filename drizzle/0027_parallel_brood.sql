CREATE TABLE "group_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	CONSTRAINT "group_classes_group_class_unique" UNIQUE("group_id","class_id")
);
--> statement-breakpoint
ALTER TABLE "group_classes" ADD CONSTRAINT "group_classes_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "group_classes" ADD CONSTRAINT "group_classes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "group_classes_group_id_idx" ON "group_classes" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_classes_class_id_idx" ON "group_classes" USING btree ("class_id");