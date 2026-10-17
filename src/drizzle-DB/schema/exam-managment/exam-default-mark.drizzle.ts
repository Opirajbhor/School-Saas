import { pgTable, uuid, integer, unique, check } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { subjectDbSchema } from "../subjects.drizzle";
import { examMarkTypesDrizzle } from "./exam-mark-types.drizzle";
import { statusEnum, timestamps } from "../enums-drizzle";

export const subjectMarkTemplates = pgTable(
  "subject_mark_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id, { onDelete: "cascade" }),

    markTypeId: uuid("mark_type_id")
      .notNull()
      .references(() => examMarkTypesDrizzle.id, { onDelete: "restrict" }),

    fullMark: integer("full_mark").notNull(),
    passMark: integer("pass_mark").notNull(),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    unique("subject_mark_template_unique").on(
      table.subjectId,
      table.markTypeId,
    ),

    check("subject_mark_template_full_mark_check", sql`${table.fullMark} >= 0`),

    check(
      "subject_mark_template_pass_mark_check",
      sql`${table.passMark} >= 0 AND ${table.passMark} <= ${table.fullMark}`,
    ),
  ],
);

export const subjectMarkTemplatesRelations = relations(
  subjectMarkTemplates,
  ({ one }) => ({
    subject: one(subjectDbSchema, {
      fields: [subjectMarkTemplates.subjectId],
      references: [subjectDbSchema.id],
    }),
    markType: one(examMarkTypesDrizzle, {
      fields: [subjectMarkTemplates.markTypeId],
      references: [examMarkTypesDrizzle.id],
    }),
  }),
);
