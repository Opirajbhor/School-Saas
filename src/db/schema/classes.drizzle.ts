import { pgTable, uuid, boolean, text } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { academicSessions } from "./academic-session.drizzle";
import { timestamps } from "../Enums/enums";
import { user } from "./auth-schema.drizzle";

export const classesDrizzle = pgTable("classes", {
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
});
