import { pgTable, uuid, boolean, text, unique } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { statusEnum, subjectTypeEnum, timestamps } from "./enums-drizzle";
import { classesDrizzle } from "./classes.drizzle";
import { groups } from "./groups.drizzle";
import { relations } from "drizzle-orm";

// subject Schema
export const subjectDbSchema = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instituteId: uuid("institute_id").references(() => instituteProfile.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    shortName: text("short_name").notNull(),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    unique("subjects_institute_session_code_unique").on(
      table.instituteId,
      table.code,
    ),
    unique("subjects_institute_session_name_unique").on(
      table.instituteId,
      table.name,
    ),
  ],
);

// subject assign schema---
export const subjectAssignSchema = pgTable(
  "subject_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    instituteId: uuid("institute_id").references(() => instituteProfile.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => groups.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    subject_type: subjectTypeEnum("subject_type")
      .notNull()
      .default("COMPULSORY"),
    isOptional: boolean("is_optional").notNull().default(false),
    isReligion: boolean("is_religion").notNull().default(false),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    unique("subject_assign_unique").on(
      table.classId,
      table.groupId,
      table.subjectId,
    ),
  ],
);

// relations
export const subjectAssignRelationOne = relations(
  subjectAssignSchema,
  ({ one }) => ({
    group: one(groups, {
      fields: [subjectAssignSchema.groupId],
      references: [groups.id],
    }),

    subject: one(subjectDbSchema, {
      fields: [subjectAssignSchema.subjectId],
      references: [subjectDbSchema.id],
    }),

    class: one(classesDrizzle, {
      fields: [subjectAssignSchema.classId],
      references: [classesDrizzle.id],
    }),
  }),
);
