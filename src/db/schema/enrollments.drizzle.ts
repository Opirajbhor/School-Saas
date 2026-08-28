import { pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { student } from "./student.drizzle";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { academicSessions } from "./academic-session.drizzle";
import { classesDrizzle, sectionDrizzle } from "./classes.drizzle";
import { relations } from "drizzle-orm";

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),

    studentId: uuid("student_id")
      .notNull()
      .references(() => student.id, {
        onDelete: "cascade",
      }),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, {
        onDelete: "cascade",
      }),

    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, {
        onDelete: "cascade",
      }),

    sectionId: uuid("section_id")
      .notNull()
      .references(() => sectionDrizzle.id, {
        onDelete: "cascade",
      }),
    roll: varchar("roll", { length: 10 }).notNull(),
  },
  (table) => [
    unique("student_unique_per_session").on(table.studentId, table.sessionId),
  ],
);

export const enrollmentRelations = relations(enrollments, ({ one }) => ({
  student: one(student, {
    fields: [enrollments.studentId],
    references: [student.id],
  }),
  class: one(classesDrizzle, {
    fields: [enrollments.classId],
    references: [classesDrizzle.id],
  }),
  section: one(sectionDrizzle, {
    fields: [enrollments.sectionId],
    references: [sectionDrizzle.id],
  }),
  session: one(academicSessions, {
    fields: [enrollments.sessionId],
    references: [academicSessions.id],
  }),
}));
