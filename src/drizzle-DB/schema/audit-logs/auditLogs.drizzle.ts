// src/drizzle-DB/schema/audit-log.drizzle.ts
import {
  pgEnum,
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { instituteProfile, user } from "@/src/drizzle-DB/schema";

// ─── Enums ─────────────────────────────────────

export const auditActionEnum = pgEnum("audit_action", [
  "CREATED",
  "UPDATED",
  "STATUS_CHANGED",
  "DELETED",
  "LOGGED_IN",
]);

export const auditEntityEnum = pgEnum("audit_entity", [
  "SESSION",
  "STUDENT",
  "TEACHER",
  "CLASS",
  "SECTION",
  "GROUP",
  "SUBJECT",
  "ASSIGNED_SUBJECT",
  "EXAM",
  "EXAM_SUBJECT",
  "MARK",
  "RESULT",
  "ASSIGNED_CLASS_TO_GROUP",
]);

// ─── Audit Logs ────────────────────────────────
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, { onDelete: "restrict" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    action: auditActionEnum("action").notNull(),

    entity: auditEntityEnum("entity").notNull(),

    entityId: uuid("entity_id"),

    description: text("description"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    ipAddress: text("ip_address"),

    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_institute_created_idx").on(
      table.instituteId,
      table.createdAt.desc(),
    ),
    index("audit_logs_entity_idx").on(table.entity, table.entityId),
    index("audit_logs_user_created_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
  ],
);

// ─── Relations ─────────────────────────────────

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  institute: one(instituteProfile, {
    fields: [auditLogs.instituteId],
    references: [instituteProfile.id],
  }),
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id],
  }),
}));

// ─── Types ─────────────────────────────────────

export type OutputAuditLogType = typeof auditLogs.$inferSelect;
export type InputAuditLogType = typeof auditLogs.$inferInsert;
