// src/lib/audit/log-audit.ts
import { db } from "@/src/drizzle-DB";
import { auditLogs, InputAuditLogType } from "@/src/drizzle-DB/schema";
import { headers } from "next/headers";

type AuditInput = Omit<InputAuditLogType, "ipAddress" | "userAgent">;

export async function auditLogAction(data: AuditInput): Promise<void> {
  try {
    const h = await headers();
    await db.insert(auditLogs).values({
      ...data,
      ipAddress: h.get("x-forwarded-for")?.split(",")[0] ?? null,
      userAgent: h.get("user-agent") ?? null,
    });
  } catch (err) {
    console.error("[audit] log failed:", err);
  }
}
