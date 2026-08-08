import { db } from "@/src/db";
import { requireInstitute } from "@/src/server-actions/get-institute-profile";
import { and, AnyColumn, eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";

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

  beforeCrud?: (params: {
    data: TData;
    profile: Awaited<ReturnType<typeof requireInstitute>>;
  }) =>
    | void
    | Partial<T["$inferInsert"]>
    | Promise<void | Partial<T["$inferInsert"]>>;

  additionFields?: Partial<T["$inferInsert"]>;

  afterCrud?: (params: {
    record: T["$inferSelect"];
    profile: Awaited<ReturnType<typeof requireInstitute>>;
  }) => void | Promise<void>;
};

// update record server action
export async function updateRecord<
  T extends InstituteTable,
  TData extends Partial<T["$inferInsert"]>,
>(config: UpdateConfig<T, TData>, id: string, data: unknown) {
  const profile = await requireInstitute();

  const parsed = config.zodSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  const beforeData = config.beforeCrud
    ? await config.beforeCrud({
        data: parsed.data,
        profile,
      })
    : undefined;

  const updateData = {
    ...parsed.data,
    ...beforeData,
    ...config.additionFields,
  };

  const [record] = await db
    .update(config.drizzleSchema)
    .set(updateData)
    .where(
      and(
        eq(config.drizzleSchema.id, id),
        eq(config.drizzleSchema.instituteId, profile.id),
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

  if (config.afterCrud) {
    await config.afterCrud({ record, profile });
  }

  return {
    success: true as const,
    data: record,
  };
}
