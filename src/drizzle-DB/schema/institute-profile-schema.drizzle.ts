import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.drizzle";
import { studentStatusEnum } from "./student.drizzle";

export const instituteProfile = pgTable("institute_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  eiin: text("eiin").notNull().unique(),
  nameBangla: text("institute_name_bangla").notNull(),
  nameEnglish: text("institute_name_english").notNull(),
  logo: text("institute_logo"),
  phone: text("admin_phone").notNull(),
  division: text("division").notNull(),
  district: text("district").notNull(),
  upazila: text("upazila").notNull(),
  status: studentStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
