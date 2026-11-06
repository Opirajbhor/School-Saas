// Platform notices: superadmin → institutes.
//
// `notice_targets` is materialised at publish time (an "all" audience expands to
// one row per institute), so delivered / read / non-reader stats are three plain
// counts instead of a special case per audience.

import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { instituteProfile } from "./institute-profile-schema.drizzle";
import { user } from "./auth-schema.drizzle";
import { timestamps } from "./enums-drizzle";

export const noticePriorityEnum = pgEnum("notice_priority", [
  "NORMAL",
  "IMPORTANT",
  "URGENT",
]);

export const noticeAudienceEnum = pgEnum("notice_audience", [
  "ALL",
  "SELECTED",
]);

export type NoticeAttachment = {
  url: string;
  name: string;
  mime?: string | null;
  size?: number | null;
};

export const notices = pgTable(
  "notices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdByName: text("created_by_name").notNull(),

    title: text("title").notNull(),
    // markdown-lite: #heading, **bold**, *italic*, - bullet, [text](url)
    body: text("body").notNull(),
    attachments: jsonb("attachments")
      .$type<NoticeAttachment[]>()
      .notNull()
      .default([]),

    priority: noticePriorityEnum("priority").notNull().default("NORMAL"),
    audience: noticeAudienceEnum("audience").notNull().default("ALL"),
    // a scheduled notice has no targets yet: the selection is kept here and
    // expanded into notice_targets when the publisher actually runs
    audienceIds: jsonb("audience_ids").$type<string[]>().notNull().default([]),

    // a future date schedules it; publishedAt stays null until the sweep runs
    publishAt: timestamp("publish_at", { withTimezone: true }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    pinned: boolean("pinned").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),

    ...timestamps,
  },
  (t) => [
    index("notices_publish_idx").on(t.publishAt),
    index("notices_priority_idx").on(t.priority),
    index("notices_archived_idx").on(t.archivedAt),
    index("notices_pinned_idx").on(t.pinned, t.publishAt),
  ],
);

export const noticeTargets = pgTable(
  "notice_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    noticeId: uuid("notice_id")
      .notNull()
      .references(() => notices.id, { onDelete: "cascade" }),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("notice_targets_unique").on(t.noticeId, t.instituteId),
    index("notice_targets_institute_idx").on(t.instituteId),
    index("notice_targets_notice_idx").on(t.noticeId),
  ],
);

export const noticeReads = pgTable(
  "notice_reads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    noticeId: uuid("notice_id")
      .notNull()
      .references(() => notices.id, { onDelete: "cascade" }),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // who in the institute opened it — the read state itself is per institute
    readByUserId: text("read_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    unique("notice_reads_unique").on(t.noticeId, t.instituteId),
    index("notice_reads_notice_idx").on(t.noticeId),
    index("notice_reads_institute_idx").on(t.instituteId),
  ],
);

export const noticesRelations = relations(notices, ({ many }) => ({
  targets: many(noticeTargets),
  reads: many(noticeReads),
}));
