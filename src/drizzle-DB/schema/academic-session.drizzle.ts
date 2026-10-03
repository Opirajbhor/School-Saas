import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { statusEnum, timestamps } from "./enums-drizzle";
import { classesDrizzle } from "./classes.drizzle";

export const academicSessions = pgTable("academic_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  year: varchar("year", {
    length: 20,
  }).notNull(),
  status: statusEnum("status").notNull().default("ACTIVE"),

  ...timestamps,
});

export const academicSessionsRelations = relations(
  academicSessions,
  ({ many }) => ({
    classes: many(classesDrizzle),
  }),
);
