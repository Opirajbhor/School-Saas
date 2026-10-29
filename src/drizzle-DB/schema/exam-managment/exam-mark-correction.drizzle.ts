// One row per mark cell that was actually changed after the sheet was first
// saved. This is the correction trail: who changed what, from which value to
// which value, and under whose approval.
//
// It is separate from the generic audit_logs feed because the values need to be
// queryable per student and per mark type, and because the editor and the
// approver are resolved by foreign key rather than dug out of a JSON blob.

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { user } from "../auth-schema.drizzle";
import { enrollments } from "../enrollments.drizzle";
import { subjectDbSchema } from "../subjects.drizzle";
import { exams } from "./exam.drizzle";
import { examMarkTypesDrizzle } from "./exam-mark-types.drizzle";
import { examMarkEditRequests } from "./exam-mark-edit-request.drizzle";

export const examMarkCorrections = pgTable(
  "exam_mark_corrections",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),

    // the enrollment already pins the student + class + section + session
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id, { onDelete: "cascade" }),

    markTypeId: uuid("mark_type_id")
      .notNull()
      .references(() => examMarkTypesDrizzle.id, { onDelete: "restrict" }),

    // null means there was no stored mark before this change
    oldMark: integer("old_mark"),
    newMark: integer("new_mark"),
    oldAbsent: boolean("old_absent"),
    newAbsent: boolean("new_absent"),

    // who made the correction. Points at `user`, not `teachers`: an admin has
    // no teacher row. `editedByRole` records which side of the workflow acted.
    editedById: text("edited_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    editedByRole: text("edited_by_role").notNull(),

    // the approved request that permitted this edit, when there was one
    editRequestId: uuid("edit_request_id").references(
      () => examMarkEditRequests.id,
      { onDelete: "set null" },
    ),
    approvedById: text("approved_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // copied from the approved request so the trail explains itself
    reason: text("reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("exam_mark_corrections_institute_idx").on(t.instituteId),
    index("exam_mark_corrections_scope_idx").on(t.examId, t.enrollmentId),
    index("exam_mark_corrections_request_idx").on(t.editRequestId),
    index("exam_mark_corrections_created_idx").on(t.createdAt),
  ],
);

export const examMarkCorrectionsRelations = relations(
  examMarkCorrections,
  ({ one }) => ({
    exam: one(exams, {
      fields: [examMarkCorrections.examId],
      references: [exams.id],
    }),
    enrollment: one(enrollments, {
      fields: [examMarkCorrections.enrollmentId],
      references: [enrollments.id],
    }),
    subject: one(subjectDbSchema, {
      fields: [examMarkCorrections.subjectId],
      references: [subjectDbSchema.id],
    }),
    markType: one(examMarkTypesDrizzle, {
      fields: [examMarkCorrections.markTypeId],
      references: [examMarkTypesDrizzle.id],
    }),
    editedBy: one(user, {
      fields: [examMarkCorrections.editedById],
      references: [user.id],
    }),
    approvedBy: one(user, {
      fields: [examMarkCorrections.approvedById],
      references: [user.id],
    }),
    editRequest: one(examMarkEditRequests, {
      fields: [examMarkCorrections.editRequestId],
      references: [examMarkEditRequests.id],
    }),
  }),
);
