import { pgTable, uuid, boolean, text, index } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { academicSessions } from "./academic-session.drizzle";
import { timestamps } from "../Enums/enums";
import { user } from "./auth-schema.drizzle";
import { unique } from "drizzle-orm/pg-core";
export const classesDrizzle = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  // unique constrain
  (table) => [
    unique("classes_institute_session_name_unique").on(
      table.instituteId,
      table.sessionId,
      table.name,
    ),
    // index

    index("classes_institute_idx").on(table.instituteId),
    index("classes_session_idx").on(table.sessionId),
  ],
);

export const sectionDrizzle = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  // unique constrain
  (table) => [
    unique("sections_class_name_unique").on(table.classId, table.name),
    index("sections_institute_idx").on(table.instituteId),
    index("sections_session_idx").on(table.sessionId),
    // index
    index("sections_class_idx").on(table.classId),
  ],
);
