// relations.ts
import { relations } from "drizzle-orm";
import {
  academicSessions,
  classesDrizzle,
  instituteProfile,
  sectionDrizzle,
} from "../schema";
import { student } from "../schema/student.drizzle";
import { enrollments } from "../schema/enrollments.drizzle";

// Academic session relation-----------
export const acadecmicSessionRelation = relations(
  academicSessions,
  ({ one, many }) => ({
    institute: one(instituteProfile, {
      fields: [academicSessions.instituteId],
      references: [instituteProfile.id],
    }),
    classes: many(classesDrizzle),
  }),
);

// Class Relation-----------------
export const classesRelations = relations(classesDrizzle, ({ one, many }) => ({
  session: one(academicSessions, {
    fields: [classesDrizzle.sessionId],
    references: [academicSessions.id],
  }),

  sections: many(sectionDrizzle),
}));
// Section Relation-----------------
export const sectionRelations = relations(sectionDrizzle, ({ one }) => ({
  class: one(classesDrizzle, {
    fields: [sectionDrizzle.classId],
    references: [classesDrizzle.id],
  }),
}));

// student relation
export const studentRelations = relations(student, ({ one, many }) => ({
  institute: one(instituteProfile, {
    fields: [student.instituteId],
    references: [instituteProfile.id],
  }),
  enrollments: many(enrollments),
}));

export const enrollmentRelations = relations(enrollments, ({ one }) => ({
  student: one(student, {
    fields: [enrollments.studentId],
    references: [student.id],
  }),
}));
