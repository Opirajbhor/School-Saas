import { db } from "@/src/drizzle-DB";
import { and, AnyColumn, eq, isNull } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import {
  AuditEntity,
  createAuditLog,
} from "../audit-logs/createAuditLog.action";
import { getUserContext } from "../shared/get-user-context.action";

type InstituteTable = PgTable & {
  id: AnyColumn;
  instituteId: AnyColumn;
};

type UpdateConfig<
  T extends InstituteTable,
  TData extends Partial<T["$inferInsert"]>,
> = {
  drizzleSchema: T;
  zodSchema: z.ZodType<TData>;
  additionFields?: Partial<T["$inferInsert"]>;
  entity: AuditEntity;
};

// update record server action
export async function updateRecord<
  T extends InstituteTable,
  TData extends Partial<T["$inferInsert"]>,
>(config: UpdateConfig<T, TData>, id: string, data: unknown) {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No User session found",
        details: {},
      };
    }
    const { userId, instituteId, role } = ctx;
    const isSuperAdmin = role === "superadmin";

    const parsed = config.zodSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false as const,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      };
    }

    const updateData = {
      ...parsed.data,
      ...config.additionFields,
    };

    return await db.transaction(async (tx) => {
      const [record] = await tx
        .update(config.drizzleSchema)
        .set(updateData)
        .where(
          and(
            eq(config.drizzleSchema.id, id),
            // a superadmin may only touch platform defaults, never a tenant row
            isSuperAdmin
              ? isNull(config.drizzleSchema.instituteId)
              : eq(config.drizzleSchema.instituteId, instituteId),
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
      // a platform default has no institute to attribute the change to
      if (!isSuperAdmin) {
        await createAuditLog(tx, {
          instituteId,
          userId,
          action: "UPDATED",
          entity: config.entity,
          entityId: (record as { id: string }).id,
        });
      }

      return {
        success: true as const,
        data: record,
      };
    });
  } catch (error) {
    console.error("Update failed:", error);

    return {
      success: false as const,
      error: "Failed to update record",
      details: {},
    };
  }
}
