import { index, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { timestamps } from "../Enums/enums";
import { user } from "./auth-schema.drizzle";

export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    nameBangla: text("name_bangla").notNull(),
    nameEnglish: text("name_english").notNull(),
    designation: text("designation").notNull(),
    mobile: text("mobile").notNull(),
    email: text("email").notNull(),
    photoUrl: text("photo_url"),
    gender: text("gender").notNull(),
    status: text("status").default("ACTIVE").notNull(),
    ...timestamps,
  },
  (table) => [
    index("teacher_mobile_idx").on(table.mobile),
    index("teacher_email_idx").on(table.email),
    unique("teacher_institute_email_unique").on(table.instituteId, table.email),
  ],
);
