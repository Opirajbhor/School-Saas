import { db } from "@/src/drizzle-DB";
import { auditLogs } from "@/src/drizzle-DB/schema";
import { headers } from "next/headers";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type AuditAction = (typeof auditLogs.$inferInsert)["action"];
export type AuditEntity = (typeof auditLogs.$inferInsert)["entity"];

type CreateAuditLogInput = {
  instituteId: string;
  userId: string;
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function createAuditLog(tx: Tx, data: CreateAuditLogInput) {
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;
  const description =
    data.description ??
    `${data.action.replace(/_/g, " ").toLowerCase()} ${data.entity.toLowerCase()}`;

  const [auditLog] = await tx
    .insert(auditLogs)
    .values({
      instituteId: data.instituteId,
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      description,
      ipAddress,
      userAgent,
      metadata: data.metadata ?? {},
    })
    .returning();

  return auditLog;
}


