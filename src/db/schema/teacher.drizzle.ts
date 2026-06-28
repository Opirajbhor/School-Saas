import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { genderEnum, statusEnum, timestamps } from "../Enums/enums";

export const teachers = pgTable("teachers", {
  id: uuid("id").defaultRandom().primaryKey(),
  instituteId: uuid("institute_id")
    .notNull()
    .references(() => instituteProfile.id, {
      onDelete: "cascade",
    }),
  userId: text("user_id"),
  nameBangla: text("name_bangla").notNull(),
  nameEnglish: text("name_english").notNull(),
  designation: text("designation").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email").notNull(),
  photoUrl: text("photo_url"),
  gender: genderEnum("gender").notNull(),
  status: statusEnum("status").default("ACTIVE").notNull(),
  ...timestamps,
});
