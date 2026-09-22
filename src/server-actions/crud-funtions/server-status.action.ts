import { db } from "@/src/drizzle-DB";
import { and, eq, Table } from "drizzle-orm";
import { DeleteConfig, InstituteTable } from "./server-delete-crud";
import { PgColumn } from "drizzle-orm/pg-core";
import { getUserContext } from "../shared/get-user-context.action";
import { createAuditLog } from "../audit-logs/createAuditLog.action";

type StatusTable = InstituteTable & {
  id: PgColumn;
  instituteId: PgColumn;
  status: PgColumn;
};

export async function toggleStatus<T extends StatusTable>(
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

    const table = config.drizzleSchema;

    return await db.transaction(async (tx) => {
      const [record] = await tx
        .select()
        .from(table as Table)
        .where(and(eq(table.id, id), eq(table.instituteId, instituteId)))
        .limit(1);

      if (!record) {
        return {
          success: false as const,
          error: "Record not found",
          details: {},
        };
      }

      const newStatus =
        typeof record.status === "boolean"
          ? !record.status
          : record.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";

      const [updated] = await tx
        .update(table)
        .set({
          status: newStatus,
        } as Partial<T["$inferInsert"]>)
        .where(and(eq(table.id, id), eq(table.instituteId, instituteId)))
        .returning();

      // ====== audit logs ==========
      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "STATUS_CHANGED",
        entity: config.entity,
        entityId: (record as { id: string }).id,
      });

      return {
        success: true as const,
        data: updated,
      };
    });
  } catch (error) {
    console.error("Status toggle failed:", error);

    return {
      success: false as const,
      error: "Failed to update status",
      details: {},
    };
  }
}
