// Exam → Class assignment

import { index, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { exams } from "./exam.drizzle";
import { classesDrizzle } from "../classes.drizzle";
import { statusEnum, timestamps } from "../enums-drizzle";
import { relations } from "drizzle-orm";

export const examClasses = pgTable(
  "exam_classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, {
        onDelete: "cascade",
      }),

    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, {
        onDelete: "cascade",
      }),
    status: statusEnum("status").notNull().default("ACTIVE"),

    ...timestamps,
  },
  (t) => [
    unique("exam_classes_exam_class_unique").on(t.examId, t.classId),
    index("exam_classes_exam_idx").on(t.examId),
    index("exam_classes_class_idx").on(t.classId),
    index("exam_classes_institute_idx").on(t.instituteId),
  ],
);

export const examClassesRelations = relations(examClasses, ({ one }) => ({
  exam: one(exams, {
    fields: [examClasses.examId],
    references: [exams.id],
  }),
  class: one(classesDrizzle, {
    fields: [examClasses.classId],
    references: [classesDrizzle.id],
  }),
}));
