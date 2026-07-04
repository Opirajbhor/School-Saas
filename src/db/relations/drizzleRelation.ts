// relations.ts
import { relations } from "drizzle-orm";
import { classesDrizzle, sectionDrizzle } from "../schema";

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
