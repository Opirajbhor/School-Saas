import { db } from "@/src/drizzle-DB";
import { eq, SQL, type Column, type Table } from "drizzle-orm";
import { getUserContext } from "../shared/get-user-context.action";

// 1. Define a generic constraint for tables that have 'id' and 'instituteId'
export type TableWithInstitute = Table & {
  instituteId: Column;
};

type ReadConfig<T extends TableWithInstitute> = {
  drizzleSchema: T;
};

export async function readRecord<T extends TableWithInstitute>(
  config: ReadConfig<T>,
) {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No User session foundF",
      };
    }
    const { instituteId } = ctx;
    const table = config.drizzleSchema;

    const record = await db
      .select()
      .from(table as Table) // Pass table instead of config.drizzleSchema
      .where(eq(table.instituteId, instituteId));

    if (!record) {
      return {
        success: false as const,
        error: "Record not found",
        details: {},
      };
    }

    return {
      success: true as const,
      data: record,
    };
  } catch {
    return {
      success: false as const,
      error: "Failed to fetch record",
      details: {},
    };
  }
}

// ---------------------read many-----------------------

type ReadManyConfig<T extends TableWithInstitute> = {
  drizzleSchema: T;

  where?: SQL;

  query?: (params: { db: typeof db; instituteId: string }) => Promise<unknown>;
};

export async function readMany<T extends TableWithInstitute>(
  config: ReadManyConfig<T>,
) {
  const table = config.drizzleSchema;

  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No User session foundF",
      };
    }
    const { instituteId } = ctx;

    if (config.query) {
      const records = await config.query({
        db,
        instituteId,
      });

      return {
        success: true as const,
        data: records,
      };
    }

    const records = await db
      .select()
      .from(table as Table)
      .where(config.where ?? eq(table.instituteId, instituteId));

    return {
      success: true as const,
      data: records,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error,
      details: {},
    };
  }
}
