// Institute-side approval of teacher mark submissions.
//
// One row per (exam, class, section, subject): the teacher's sheet goes PENDING,
// the institute approves or rejects it, and a rejection sends it back for edits.
// `roster_hash` freezes the student set at submit time so an approval can refuse
// to sign off a sheet whose class list changed underneath it.

import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { instituteProfile } from "../institute-profile-schema.drizzle";
import { classesDrizzle, sectionDrizzle } from "../classes.drizzle";
import { subjectDbSchema } from "../subjects.drizzle";
import { teachers } from "../teacher.drizzle";
import { user } from "../auth-schema.drizzle";
import { timestamps } from "../enums-drizzle";
import { exams } from "./exam.drizzle";

export const markSubmissionStatusEnum = pgEnum("mark_submission_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REOPENED",
]);

export const markSubmissionActionEnum = pgEnum("mark_submission_action", [
  "SUBMIT",
  "RESUBMIT",
  "APPROVE",
  "REJECT",
  "REOPEN",
]);

export const markSubmissions = pgTable(
  "mark_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),
    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sectionDrizzle.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id, { onDelete: "cascade" }),

    // snapshot: the teacher row disappears if they leave the institute
    teacherId: uuid("teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    teacherName: text("teacher_name").notNull(),

    status: markSubmissionStatusEnum("status").notNull().default("PENDING"),
    resubmissionCount: integer("resubmission_count").notNull().default(0),

    // roster fingerprint at submit time
    studentCount: integer("student_count").notNull().default(0),
    rosterHash: text("roster_hash").notNull().default(""),

    teacherNote: text("teacher_note"),
    submittedById: text("submitted_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    decidedById: text("decided_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    decidedByName: text("decided_by_name"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNote: text("decision_note"),

    ...timestamps,
  },
  (t) => [
    unique("mark_submissions_scope_unique").on(
      t.instituteId,
      t.examId,
      t.sectionId,
      t.subjectId,
    ),
    index("mark_submissions_status_idx").on(t.instituteId, t.status),
    index("mark_submissions_exam_idx").on(t.examId),
  ],
);

export const markSubmissionEvents = pgTable(
  "mark_submission_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => markSubmissions.id, { onDelete: "cascade" }),
    action: markSubmissionActionEnum("action").notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    actorRole: text("actor_role").notNull(),
    actorName: text("actor_name").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("mark_submission_events_idx").on(t.submissionId, t.createdAt)],
);

export const markSubmissionsRelations = relations(
  markSubmissions,
  ({ one, many }) => ({
    exam: one(exams, {
      fields: [markSubmissions.examId],
      references: [exams.id],
    }),
    section: one(sectionDrizzle, {
      fields: [markSubmissions.sectionId],
      references: [sectionDrizzle.id],
    }),
    subject: one(subjectDbSchema, {
      fields: [markSubmissions.subjectId],
      references: [subjectDbSchema.id],
    }),
    events: many(markSubmissionEvents),
  }),
);
