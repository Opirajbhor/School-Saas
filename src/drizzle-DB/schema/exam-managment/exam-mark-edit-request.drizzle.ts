// A teacher's request to unlock submitted marks for one exam + section + subject.
// Approving it re-opens exactly that scope — nothing wider.

import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { classesDrizzle, sectionDrizzle } from "../classes.drizzle";
import { subjectDbSchema } from "../subjects.drizzle";
import { teachers } from "../teacher.drizzle";
import { markEditRequestStatusEnum, timestamps } from "../enums-drizzle";
import { exams } from "./exam.drizzle";

export const examMarkEditRequests = pgTable(
  "exam_mark_edit_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),

    // the unlock is scoped to this class + section + subject only
    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, { onDelete: "cascade" }),

    sectionId: uuid("section_id")
      .notNull()
      .references(() => sectionDrizzle.id, { onDelete: "cascade" }),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id, { onDelete: "cascade" }),

    requestedById: uuid("requested_by_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),

    // why the teacher needs the marks re-opened
    reason: text("reason").notNull(),

    status: markEditRequestStatusEnum("status").notNull().default("PENDING"),

    // filled when an admin approves or rejects
    resolvedById: uuid("resolved_by_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    resolutionNote: text("resolution_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),

    ...timestamps,
  },
  (t) => [
    index("exam_mark_edit_requests_institute_idx").on(t.instituteId),
    index("exam_mark_edit_requests_scope_idx").on(
      t.examId,
      t.sectionId,
      t.subjectId,
    ),
    index("exam_mark_edit_requests_status_idx").on(t.status),
  ],
);

export const examMarkEditRequestsRelations = relations(
  examMarkEditRequests,
  ({ one }) => ({
    exam: one(exams, {
      fields: [examMarkEditRequests.examId],
      references: [exams.id],
    }),
    class: one(classesDrizzle, {
      fields: [examMarkEditRequests.classId],
      references: [classesDrizzle.id],
    }),
    section: one(sectionDrizzle, {
      fields: [examMarkEditRequests.sectionId],
      references: [sectionDrizzle.id],
    }),
    subject: one(subjectDbSchema, {
      fields: [examMarkEditRequests.subjectId],
      references: [subjectDbSchema.id],
    }),
    requestedBy: one(teachers, {
      fields: [examMarkEditRequests.requestedById],
      references: [teachers.id],
    }),
    resolvedBy: one(teachers, {
      fields: [examMarkEditRequests.resolvedById],
      references: [teachers.id],
    }),
  }),
);
