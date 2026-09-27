import {
  pgTable,
  uuid,
  text,
  unique,
  index,
  timestamp,
} from "drizzle-orm/pg-core";

export const exams = pgTable(
  "exams",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    startDate: timestamp("start_date", {
      withTimezone: true,
    }).notNull(),

    endDate: timestamp("end_date", {
      withTimezone: true,
    }).notNull(),

    publishDate: timestamp("publish_date", {
      withTimezone: true,
    }),
    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    index("exams_institute_idx").on(t.instituteId),
    unique("exams_institute_name_unique").on(t.instituteId, t.name),
  ],
);

// Relations
import { relations } from "drizzle-orm";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { statusEnum, timestamps } from "../enums-drizzle";
import { examClasses } from "./exam-assign.drizzle";
export const examsRelations = relations(exams, ({ one, many }) => ({
  institute: one(instituteProfile, {
    fields: [exams.instituteId],
    references: [instituteProfile.id],
  }),
  assignClasses: many(examClasses),
}));
