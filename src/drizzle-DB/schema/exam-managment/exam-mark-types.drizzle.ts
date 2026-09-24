import { pgTable, uuid, varchar, unique } from "drizzle-orm/pg-core";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { statusEnum, timestamps } from "../enums-drizzle";

/* -------------------------
   Exam Mark Types
-------------------------- */

export const examMarkTypesDrizzle = pgTable(
  "exam_mark_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 50 }).notNull(),
    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    unique("exam_mark_types_institute_name_unique").on(
      table.instituteId,
      table.name,
    ),
  ],
);
