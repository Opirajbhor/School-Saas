// Support tickets: a teacher → institute thread, and an institute → superadmin
// thread once escalated (or opened directly at platform scope).
//
// Names and emails are snapshotted onto the ticket and the messages, because a
// teacher leaving the institute deletes their `teachers` row — the support
// history must survive that, so the user id is `set null` and the label stays.

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { instituteProfile } from "./institute-profile-schema.drizzle";
import { user } from "./auth-schema.drizzle";
import { timestamps } from "./enums-drizzle";

export const ticketScopeEnum = pgEnum("ticket_scope", [
  "INSTITUTE",
  "PLATFORM",
]);

export const ticketCategoryEnum = pgEnum("ticket_category", [
  "ACADEMIC",
  "EXAM",
  "RESULT",
  "ATTENDANCE",
  "BILLING",
  "TECHNICAL",
  "OTHER",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // null only when a superadmin opens a platform-wide ticket
    instituteId: uuid("institute_id").references(() => instituteProfile.id, {
      onDelete: "cascade",
    }),

    scope: ticketScopeEnum("scope").notNull().default("INSTITUTE"),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    category: ticketCategoryEnum("category").notNull().default("OTHER"),
    priority: ticketPriorityEnum("priority").notNull().default("MEDIUM"),
    status: ticketStatusEnum("status").notNull().default("OPEN"),

    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdByRole: text("created_by_role").notNull().default("user"),
    createdByName: text("created_by_name").notNull(),
    createdByEmail: text("created_by_email"),

    assignedToId: text("assigned_to_id").references(() => user.id, {
      onDelete: "set null",
    }),
    assignedToName: text("assigned_to_name"),

    // ageing: derived from priority when the ticket is opened
    dueAt: timestamp("due_at", { withTimezone: true }),
    lastReplyAt: timestamp("last_reply_at", { withTimezone: true }),
    firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    reopenedCount: integer("reopened_count").notNull().default(0),

    ...timestamps,
  },
  (t) => [
    index("support_tickets_institute_idx").on(t.instituteId),
    index("support_tickets_status_idx").on(t.status),
    index("support_tickets_scope_idx").on(t.scope),
    index("support_tickets_assigned_idx").on(t.assignedToId),
    index("support_tickets_created_idx").on(t.createdAt),
  ],
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),

    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    authorRole: text("author_role").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),

    // internal notes are for the institute/superadmin only, never the teacher
    isInternal: boolean("is_internal").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("support_messages_ticket_idx").on(t.ticketId, t.createdAt)],
);

export const supportAttachments = pgTable(
  "support_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => supportMessages.id, {
      onDelete: "cascade",
    }),

    url: text("url").notNull(),
    name: text("name").notNull(),
    mime: text("mime"),
    size: integer("size"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("support_attachments_ticket_idx").on(t.ticketId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),

    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);

export const supportTicketsRelations = relations(
  supportTickets,
  ({ one, many }) => ({
    institute: one(instituteProfile, {
      fields: [supportTickets.instituteId],
      references: [instituteProfile.id],
    }),
    messages: many(supportMessages),
    attachments: many(supportAttachments),
  }),
);

export const supportMessagesRelations = relations(
  supportMessages,
  ({ one, many }) => ({
    ticket: one(supportTickets, {
      fields: [supportMessages.ticketId],
      references: [supportTickets.id],
    }),
    attachments: many(supportAttachments),
  }),
);
