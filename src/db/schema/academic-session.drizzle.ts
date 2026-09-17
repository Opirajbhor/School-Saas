import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  index,
} from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { timestamps } from "./enums-drizzle";
import { classesDrizzle } from "./classes.drizzle";
import { relations } from "drizzle-orm";

export const academicSessions = pgTable(
  "academic_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),
    year: varchar("year", {
      length: 20,
    }).notNull(),
    isActive: boolean("is_active").notNull().default(false),
    ...timestamps,
  },
  // unique constrain
  (table) => [
    unique("academic_sessions_institute_year_unique").on(
      table.instituteId,
      table.year,
    ),
    // index

    index("academic_sessions_institute_idx").on(table.instituteId),
  ],
);

export const academicSessionsRelations = relations(
  academicSessions,
  ({ many }) => ({
    classes: many(classesDrizzle),
  }),
);
