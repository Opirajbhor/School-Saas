// One row per publish event for one exam + class.
//
// A snapshot freezes the calculated result sheet exactly as it was when the
// admin published, so a published result never changes even if a mark is later
// corrected. Re-publishing after a correction writes a new version and keeps
// the older ones as history; nothing is ever overwritten.
//
// The sheet is a nested, read-mostly document that is displayed whole and never
// queried by field, so it is stored as a single jsonb payload rather than
// spread across per-student tables.

import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { instituteProfile } from "../institute-profile-schema.drizzle";
import { user } from "../auth-schema.drizzle";
import { classesDrizzle } from "../classes.drizzle";
import { statusEnum, timestamps } from "../enums-drizzle";
import { exams } from "./exam.drizzle";

export const examResultSnapshots = pgTable(
  "exam_result_snapshots",
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

    // 1, 2, 3 ... per exam + class, so history stays readable
    version: integer("version").notNull(),

    // the frozen result sheet, shaped like OutputExamResultType
    payload: jsonb("payload").notNull(),

    // hash of the payload so a later reader can detect tampering or drift
    payloadHash: text("payload_hash").notNull(),

    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedById: text("published_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // filled when the admin takes the results back down
    unpublishedAt: timestamp("unpublished_at", { withTimezone: true }),
    unpublishedById: text("unpublished_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    index("exam_result_snapshots_institute_idx").on(t.instituteId),
    index("exam_result_snapshots_scope_idx").on(t.examId, t.classId),
    unique("exam_result_snapshots_version_unique").on(
      t.examId,
      t.classId,
      t.version,
    ),
  ],
);

export const examResultSnapshotsRelations = relations(
  examResultSnapshots,
  ({ one }) => ({
    exam: one(exams, {
      fields: [examResultSnapshots.examId],
      references: [exams.id],
    }),
    class: one(classesDrizzle, {
      fields: [examResultSnapshots.classId],
      references: [classesDrizzle.id],
    }),
    publishedBy: one(user, {
      fields: [examResultSnapshots.publishedById],
      references: [user.id],
    }),
    unpublishedBy: one(user, {
      fields: [examResultSnapshots.unpublishedById],
      references: [user.id],
    }),
  }),
);
