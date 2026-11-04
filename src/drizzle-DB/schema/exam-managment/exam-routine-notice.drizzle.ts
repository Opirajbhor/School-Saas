// The instructions printed under an exam routine ("bring your admit card",
// "report 15 minutes early"). One note per exam per institute, because the same
// platform exam is published by several schools with their own wording.

import { pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { instituteProfile } from "../institute-profile-schema.drizzle";
import { timestamps } from "../enums-drizzle";
import { exams } from "./exam.drizzle";

export const examRoutineNotices = pgTable(
  "exam_routine_notices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),

    notice: text("notice").notNull().default(""),

    ...timestamps,
  },
  (t) => [unique("exam_routine_notices_exam_unique").on(t.instituteId, t.examId)],
);

export const examRoutineNoticesRelations = relations(
  examRoutineNotices,
  ({ one }) => ({
    exam: one(exams, {
      fields: [examRoutineNotices.examId],
      references: [exams.id],
    }),
  }),
);
