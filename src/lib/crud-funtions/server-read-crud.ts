import { db } from "@/src/db";
import { requireInstitute } from "@/src/server-actions/get-institute-profile";
import { and, eq, type Column, type Table } from "drizzle-orm";

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
    const profile = await requireInstitute();
    const table = config.drizzleSchema;

    const record = await db
      .select()
      .from(table as Table) // Pass table instead of config.drizzleSchema
      .where(eq(table.instituteId, profile.id));

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
