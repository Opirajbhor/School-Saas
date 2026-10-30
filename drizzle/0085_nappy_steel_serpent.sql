CREATE TABLE "exam_result_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by_id" text,
	"unpublished_at" timestamp with time zone,
	"unpublished_by_id" text,
	"status" "status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_result_snapshots_version_unique" UNIQUE("exam_id","class_id","version")
);
--> statement-breakpoint
ALTER TABLE "exam_result_snapshots" ADD CONSTRAINT "exam_result_snapshots_institute_id_institute_profile_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institute_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result_snapshots" ADD CONSTRAINT "exam_result_snapshots_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result_snapshots" ADD CONSTRAINT "exam_result_snapshots_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result_snapshots" ADD CONSTRAINT "exam_result_snapshots_published_by_id_user_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result_snapshots" ADD CONSTRAINT "exam_result_snapshots_unpublished_by_id_user_id_fk" FOREIGN KEY ("unpublished_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_result_snapshots_institute_idx" ON "exam_result_snapshots" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX "exam_result_snapshots_scope_idx" ON "exam_result_snapshots" USING btree ("exam_id","class_id");