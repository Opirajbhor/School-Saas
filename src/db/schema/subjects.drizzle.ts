import { pgTable, uuid, boolean, text, unique } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { religionEnum, statusEnum, timestamps } from "./enums-drizzle";

export const subjectDbSchema = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    shortName: text("short_name").notNull(),
    isReligion: boolean("is_religion").notNull().default(false),
    status: statusEnum("status").notNull().default("ACTIVE"),
    religion: religionEnum("religion"),
    ...timestamps,
  },
  (table) => [
    // Ensures subject code is unique per session in an institute
    unique("subjects_institute_session_code_unique").on(
      table.instituteId,
      table.code,
    ),
    // Ensures subject full name is unique per session in an institute
    unique("subjects_institute_session_name_unique").on(
      table.instituteId,
      table.name,
    ),
  ],
);
