import {
  pgTable,
  uuid,
  varchar,
  unique,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { statusEnum, timestamps } from "../enums-drizzle";

/* -------------------------
   Exam Mark Ranges
-------------------------- */

export const examGradeRangeDrizzle = pgTable(
  "exam_grade_scales",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 100 }).notNull(),
    minMark: integer("min_mark").notNull(),
    maxMark: integer("max_mark").notNull(),

    GPA: decimal("GPA", {
      precision: 4,
      scale: 2,
    }).notNull(),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    unique("exam_grade_scales_institute_name_unique").on(
      table.instituteId,
      table.name,
      table.maxMark,
      table.minMark,
      table.GPA,
    ),
  ],
);
