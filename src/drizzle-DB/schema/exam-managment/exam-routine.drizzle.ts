// Exam routine — one row per sitting: a subject, on a date, at a time, for a
// class (optionally narrowed to a single section, as practical exams are).

import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  time,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { instituteProfile } from "../institute-profile-schema.drizzle";
import { classesDrizzle, sectionDrizzle } from "../classes.drizzle";
import { subjectDbSchema } from "../subjects.drizzle";
import { timestamps } from "../enums-drizzle";
import { exams } from "./exam.drizzle";

// theory papers are written by the whole class; practicals are sat in small
// batches and often differ per section, which is why they are a separate kind
export const examRoutineKindEnum = pgEnum("exam_routine_kind", [
  "THEORY",
  "PRACTICAL",
]);

export const examRoutines = pgTable(
  "exam_routines",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),

    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, { onDelete: "cascade" }),

    // null = the paper is sat by every section of the class together
    sectionId: uuid("section_id").references(() => sectionDrizzle.id, {
      onDelete: "cascade",
    }),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id, { onDelete: "cascade" }),

    kind: examRoutineKindEnum("kind").notNull().default("THEORY"),

    examDate: date("exam_date").notNull(),
    startsAt: time("starts_at").notNull(),
    endsAt: time("ends_at").notNull(),

    // "room 2", "bring calculator" — printed under the subject
    note: text("note"),

    ...timestamps,
  },
  (t) => [
    index("exam_routines_exam_idx").on(t.examId),
    index("exam_routines_class_idx").on(t.classId),
    index("exam_routines_institute_idx").on(t.instituteId),
    index("exam_routines_date_idx").on(t.examDate),
    // one paper per class/date/kind; the section is part of the key so two
    // sections may sit different practicals at the same time
    unique("exam_routines_slot_unique").on(
      t.examId,
      t.classId,
      t.subjectId,
      t.kind,
      t.examDate,
    ),
  ],
);

export const examRoutinesRelations = relations(examRoutines, ({ one }) => ({
  exam: one(exams, {
    fields: [examRoutines.examId],
    references: [exams.id],
  }),
  class: one(classesDrizzle, {
    fields: [examRoutines.classId],
    references: [classesDrizzle.id],
  }),
  section: one(sectionDrizzle, {
    fields: [examRoutines.sectionId],
    references: [sectionDrizzle.id],
  }),
  subject: one(subjectDbSchema, {
    fields: [examRoutines.subjectId],
    references: [subjectDbSchema.id],
  }),
}));
