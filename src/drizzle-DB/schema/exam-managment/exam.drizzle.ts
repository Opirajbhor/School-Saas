import { pgTable, uuid, text, timestamp, unique, index } from "drizzle-orm/pg-core";

export const exams = pgTable(
  "exams",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id").references(() => instituteProfile.id, {
      onDelete: "cascade",
    }),

    // the session the exam belongs to; null for pre-existing rows
    sessionId: uuid("session_id").references(() => academicSessions.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull(),

    // where the mark sheet sits in its lifecycle. OPEN allows entry; once
    // FINALIZED or PUBLISHED every write is refused, even for admins.
    markWorkflow: markWorkflowEnum("mark_workflow").notNull().default("OPEN"),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
    finalizedById: text("finalized_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedById: text("published_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    index("exams_institute_idx").on(t.instituteId),
    index("exams_session_idx").on(t.sessionId),
    unique("exams_institute_name_unique").on(t.instituteId, t.name),
  ],
);

// Relations
import { relations } from "drizzle-orm";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { markWorkflowEnum, statusEnum, timestamps } from "../enums-drizzle";
import { user } from "../auth-schema.drizzle";
import { examClasses } from "./exam-assign.drizzle";
import { academicSessions } from "../academic-session.drizzle";
export const examsRelations = relations(exams, ({ one, many }) => ({
  institute: one(instituteProfile, {
    fields: [exams.instituteId],
    references: [instituteProfile.id],
  }),
  session: one(academicSessions, {
    fields: [exams.sessionId],
    references: [academicSessions.id],
  }),
  assignClasses: many(examClasses),
}));
