// relations.ts
import { relations } from "drizzle-orm";
import {
  academicSessions,
  classesDrizzle,
  groups,
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
  groups: many(groups),
}));
// Section Relation-----------------
export const sectionRelations = relations(sectionDrizzle, ({ one }) => ({
  class: one(classesDrizzle, {
    fields: [sectionDrizzle.classId],
    references: [classesDrizzle.id],
  }),
}));
