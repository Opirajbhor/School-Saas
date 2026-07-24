import {
  date,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { instituteProfile } from "./institute-profile-schema.drizzle";
import { timestamps } from "../Enums/enums";

export const studentGenderEnum = pgEnum("student_gender", [
  "MALE",
  "FEMALE",
  "OTHER",
]);

export const studentBloodGroupEnum = pgEnum("student_blood_group", [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);

export const studentStatusEnum = pgEnum("student_status", [
  "ACTIVE",
  "INACTIVE",
  "TRANSFERRED",
  "LEFT",
]);

export const student = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),

    studentId: varchar("student_id", { length: 30 }).notNull(),

    englishName: varchar("english_name", { length: 100 }).notNull(),

    banglaName: varchar("bangla_name", { length: 200 }),

    gender: studentGenderEnum("gender").notNull(),

    dateOfBirth: date("date_of_birth", {
      mode: "date",
    }).notNull(),

    religion: varchar("religion", { length: 50 }).notNull(),

    nationality: varchar("nationality", { length: 50 })
      .notNull()
      .default("Bangladeshi"),

    mobile: varchar("mobile", { length: 11 }).notNull(),

    email: varchar("email", { length: 255 }),

    photoUrl: text("photo_url"),

    birthCertificateNo: varchar("birth_certificate_no", {
      length: 50,
    }),

    presentAddress: text("present_address").notNull(),

    permanentAddress: text("permanent_address").notNull(),

    status: studentStatusEnum("status").notNull().default("ACTIVE"),

    ...timestamps,
  },
  (table) => [
    unique("student_unique_per_institute").on(
      table.instituteId,
      table.studentId,
    ),
  ],
);
