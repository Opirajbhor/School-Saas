import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.drizzle";

export const instituteProfile = pgTable("institute_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
  eiin: text("eiin").notNull().unique(),
  instituteNameBangla: text("institute_name_bangla").notNull(),
  instituteNameEnglish: text("institute_name_english").notNull(),
  adminNameBangla: text("admin_name_bangla").notNull(),
  adminNameEnglish: text("admin_name_english").notNull(),
  adminDesignation: text("admin_designation").notNull(),
  adminPhone: text("admin_phone").notNull(),
  division: text("division").notNull(),
  district: text("district").notNull(),
  upazila: text("upazila").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
