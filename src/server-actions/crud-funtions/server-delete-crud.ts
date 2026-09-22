import type { PgTable } from "drizzle-orm/pg-core";
import { AnyColumn, and, eq } from "drizzle-orm";
import { db } from "@/src/drizzle-DB";
import { getUserContext } from "../shared/get-user-context.action";
import { auditLogs } from "@/src/drizzle-DB/schema";
import {
  AuditEntity,
  createAuditLog,
} from "../audit-logs/createAuditLog.action";

export type InstituteTable = PgTable & {
  id: AnyColumn;
  instituteId: AnyColumn;
};

export type DeleteConfig<T extends InstituteTable> = {
  drizzleSchema: T;
  entity: AuditEntity;
  describe?: (record: T["$inferSelect"]) => string;
};

export async function deleteRecord<T extends InstituteTable>(
  config: DeleteConfig<T>,
  id: string,
) {
  try {
    const ctx = await getUserContext();

    if (!ctx) {
      return {
        success: false as const,
        error: "No User session foundF",
        details: {},
      };
    }
    const { userId, instituteId } = ctx;

    return await db.transaction(async (tx) => {
      const [record] = await tx
        .delete(config.drizzleSchema)
        .where(
          and(
            eq(config.drizzleSchema.id, id),
            eq(config.drizzleSchema.instituteId, instituteId),
          ),
        )
        .returning();

      if (!record) {
        return {
          success: false as const,
          error: "Record not found",
          details: {},
        };
      }
      // ====== audit logs ==========
      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "DELETED",
        entity: config.entity,
        entityId: (record as { id: string }).id,
      });

      return {
        success: true as const,
        data: record,
      };
    });
  } catch (error) {
    console.error("Delete failed:", error);

    return {
      success: false as const,
      error: "Failed to delete record",
      details: {},
    };
  }
}
