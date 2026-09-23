import { db } from "@/src/drizzle-DB";
import { eq, InferSelectModel } from "drizzle-orm";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { getUserContext } from "../shared/get-user-context.action";

type TableWithInstitute = PgTable & {
  instituteId: PgColumn;
};

export type TableConfig<
  K extends string = string,
  T extends PgTable = PgTable,
> = {
  key: K;
  drizzleSchema: T;
};

function hasInstituteId(table: PgTable): table is TableWithInstitute {
  return "instituteId" in table;
}

// Maps array of configs [{ key: "users", drizzleSchema: usersTable }, ...]
// to { users: User[], posts: Post[] }
type InferDataMap<T extends readonly TableConfig[]> = {
  [C in T[number] as C["key"]]: InferSelectModel<C["drizzleSchema"]>[];
};

export async function readMultipleRecords<
  const TConfigs extends readonly TableConfig[],
>(configs: TConfigs) {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No User session foundF",
      };
    }
    const { instituteId } = ctx;

    const results = await Promise.allSettled(
      configs.map(async ({ key, drizzleSchema }) => {
        if (hasInstituteId(drizzleSchema)) {
          const records = await db
            .select()
            .from(drizzleSchema)
            .where(eq(drizzleSchema.instituteId, instituteId));
          return { key, data: records };
        }

        const records = await db.select().from(drizzleSchema);
        return { key, data: records };
      }),
    );

    const dataMap = {} as InferDataMap<TConfigs>;

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { key, data } = result.value;
        (dataMap as Record<string, unknown>)[key] = data;
      }
    });

    return {
      success: true as const,
      data: dataMap,
    };
  } catch {
    return {
      success: false as const,
      error: "Failed to fetch records",
      details: {},
    };
  }
}
