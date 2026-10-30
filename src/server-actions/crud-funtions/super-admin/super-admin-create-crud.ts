import { db } from "@/src/drizzle-DB";
import type { PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import { InferInsertModel } from "drizzle-orm";
import { getUserContext } from "../../shared/get-user-context.action";

type TableWithId = PgTable & {
  $inferSelect: { id: string; [key: string]: unknown };
  $inferInsert: Record<string, unknown>;
};
type CreateConfig<T extends TableWithId> = {
  zodSchema: z.ZodType<Partial<T["$inferInsert"]>>;
  additionFields?: Partial<T["$inferInsert"]>;
  drizzleSchema: T;
};

// server create function
export async function CreateSuperAdmin<T extends TableWithId>(
  config: CreateConfig<T>,
  data: unknown,
) {
  try {
    // these rows are platform-wide defaults (instituteId stays null), so only a
    // superadmin may create them
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No User session found",
        details: {},
      };
    }
    if (ctx.role !== "superadmin") {
      return { success: false as const, error: "Not authorized", details: {} };
    }

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
      } as InferInsertModel<typeof config.drizzleSchema>;

      const [record] = await tx
        .insert(config.drizzleSchema)
        .values(insertData)
        .returning();

      if (!record) {
        throw new Error("Insert failed");
      }

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
