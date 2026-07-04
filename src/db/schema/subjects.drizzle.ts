import { pgTable, uuid, boolean, text, index } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { academicSessions } from "./academic-session.drizzle";
import { timestamps } from "../Enums/enums";
import { unique } from "drizzle-orm/pg-core";

export const subjectDbSchema = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  // unique constrain
  (table) => [
    unique("subject_institute_session_name_unique").on(
      table.instituteId,
      table.sessionId,
      table.code,
    ),
    // index

    index("subjects_institute_idx").on(table.instituteId),
    index("subjects_session_idx").on(table.sessionId),
  ],
);
