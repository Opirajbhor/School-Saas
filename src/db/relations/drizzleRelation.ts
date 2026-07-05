// relations.ts
import { relations } from "drizzle-orm";
import {
  academicSessions,
  classesDrizzle,
  instituteProfile,
  sectionDrizzle,
} from "../schema";

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
export const classesRelations = relations(classesDrizzle, ({ many }) => ({
  sections: many(sectionDrizzle),
}));
// Section Relation-----------------
export const sectionRelations = relations(sectionDrizzle, ({ one }) => ({
  class: one(classesDrizzle, {
    fields: [sectionDrizzle.classId],
    references: [classesDrizzle.id],
  }),
}));
