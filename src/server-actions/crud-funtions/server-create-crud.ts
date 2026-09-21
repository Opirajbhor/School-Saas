import { db } from "@/src/drizzle-DB";
import type { PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import { auditLogs } from "@/src/drizzle-DB/schema";
import { InferInsertModel } from "drizzle-orm";
import { getUserContext } from "../shared/get-user-context.action";

type TableWithId = PgTable & {
  $inferSelect: { id: string; [key: string]: unknown };
  $inferInsert: Record<string, unknown>;
};
type CreateConfig<T extends TableWithId> = {
  zodSchema: z.ZodType<Partial<T["$inferInsert"]>>;
  additionFields?: Partial<T["$inferInsert"]>;
  drizzleSchema: T;
  entity: (typeof auditLogs.$inferInsert)["entity"];
  describe?: (record: T["$inferSelect"]) => string;
};

// server create function
export async function createRecord<T extends TableWithId>(
  config: CreateConfig<T>,
  data: unknown,
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
    const { userId, teacherId, instituteId } = ctx;

    // Validate input first
    const parsed = config.zodSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false as const,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      };
    }

    return await db.transaction(async (tx) => {
      const insertData = {
        ...parsed.data,
        ...config.additionFields,
        instituteId,
      } as InferInsertModel<typeof config.drizzleSchema>;

      const [record] = await tx
        .insert(config.drizzleSchema)
        .values(insertData)
        .returning();

      if (!record) {
        throw new Error("Insert failed");
      }
      // Run custom logic after successful insert
      // audit logs
      await tx.insert(auditLogs).values({
        instituteId,
        userId,
        action: "CREATE",
        entity: config.entity,
        entityId: (record as { id: string }).id,
        description: config.describe?.(record) ?? `Created ${config.entity}`,
        metadata: { after: record, teacherId },
      });

      return {
        success: true as const,
        data: record,
      };
    });
  } catch (error) {
    console.error("Create failed:", error);

    return {
      success: false as const,
      error: "Failed to create record",
      details: {},
    };
  }
}
