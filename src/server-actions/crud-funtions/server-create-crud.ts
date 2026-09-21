import { db } from "@/src/drizzle-DB";
import { requireInstitute } from "@/src/server-actions/get-institute-profile";
import type { PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import { auditLogAction } from "../audit-logs/createAuditLog.action";
import { requireUserContext } from "../shared/get-user-context.action";

type CreateConfig<T extends PgTable> = {
  // Runs before insert. Can check/change data.
  beforeCrud?: (params: {
    data: T["$inferInsert"];
    tx: typeof db;
    profile: Awaited<ReturnType<typeof requireInstitute>>;
  }) =>
    | void
    | Partial<T["$inferInsert"]>
    | Promise<void | Partial<T["$inferInsert"]>>;

  // Zod validation
  zodSchema: z.ZodType<Partial<T["$inferInsert"]>>;

  // Extra fields to add before insert
  additionFields?: Partial<T["$inferInsert"]>;

  // Runs after successful insert
  afterCrud?: (params: {
    record: T["$inferSelect"];
    tx: typeof db;
    profile: Awaited<ReturnType<typeof requireInstitute>>;
  }) => void | Promise<void>;

  // Drizzle table
  drizzleSchema: T;
};

// server create function
export async function createRecord<T extends PgTable>(
  config: CreateConfig<T>,
  data: unknown,
) {
  try {
    const { instituteId, userId } = await requireUserContext();

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
      // Allow custom checks/modifications before insert
      const beforeData = config.beforeCrud
        ? await config.beforeCrud({
            data: parsed.data,
            tx: db,
            profile,
          })
        : undefined;

      const insertData = {
        ...parsed.data,
        ...beforeData,
        ...config.additionFields,

        instituteId: instituteId,
      };

      const [record] = await tx
        .insert(config.drizzleSchema)
        .values(insertData)
        .returning();

      // Run custom logic after successful insert
      if (config.afterCrud) {
        await config.afterCrud({
          record,
          tx: db,
          profile,
        });
      }
      await auditLogAction({
        instituteId: instituteId,
        userId: userId,
        action: "CREATE",
        entity: "TEACHER",
        entityId: teacher.id,
        description: `Created teacher ${teacher.nameEnglish}`,
        metadata: { after: teacher },
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
