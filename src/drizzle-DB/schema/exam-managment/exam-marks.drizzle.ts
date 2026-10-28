// Per-student marks for one exam / subject / mark type

import {
  boolean,
  index,
  integer,
  pgTable,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { enrollments } from "../enrollments.drizzle";
import { subjectDbSchema } from "../subjects.drizzle";
import { exams } from "./exam.drizzle";
import { examMarkTypesDrizzle } from "./exam-mark-types.drizzle";
import {
  markEntryStatusEnum,
  statusEnum,
  timestamps,
} from "../enums-drizzle";

export const examMarks = pgTable(
  "exam_marks",
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

    // mark types are global and shared between subjects, so the subject
    // has to be stored on the row itself
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id, { onDelete: "cascade" }),

    markTypeId: uuid("mark_type_id")
      .notNull()
      .references(() => examMarkTypesDrizzle.id, { onDelete: "restrict" }),

    mark: integer("mark").notNull(),
    // an absent student stores 0 and the flag instead of a mark
    absent: boolean("absent").notNull().default(false),

    // draft until the section's marks are submitted for this exam + subject
    entryStatus: markEntryStatusEnum("entry_status").notNull().default("DRAFT"),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    unique("exam_marks_exam_enrollment_subject_marktype_unique").on(
      t.examId,
      t.enrollmentId,
      t.subjectId,
      t.markTypeId,
    ),
    index("exam_marks_institute_idx").on(t.instituteId),
    index("exam_marks_exam_idx").on(t.examId),
    index("exam_marks_enrollment_idx").on(t.enrollmentId),
    index("exam_marks_exam_subject_idx").on(t.examId, t.subjectId),
    index("exam_marks_entry_status_idx").on(t.entryStatus),
  ],
);

export const examMarksRelations = relations(examMarks, ({ one }) => ({
  exam: one(exams, {
    fields: [examMarks.examId],
    references: [exams.id],
  }),
  enrollment: one(enrollments, {
    fields: [examMarks.enrollmentId],
    references: [enrollments.id],
  }),
  subject: one(subjectDbSchema, {
    fields: [examMarks.subjectId],
    references: [subjectDbSchema.id],
  }),
  markType: one(examMarkTypesDrizzle, {
    fields: [examMarks.markTypeId],
    references: [examMarkTypesDrizzle.id],
  }),
}));
