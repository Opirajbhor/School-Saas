import { db } from "@/src/db";
import { requireInstitute } from "@/src/server-actions/get-institute-profile";
import { eq, SQL, type Column, type Table } from "drizzle-orm";

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
    const profile = await requireInstitute();

    if (config.query) {
      const records = await config.query({
        db,
        instituteId: profile.id,
      });

      return {
        success: true as const,
        data: records,
      };
    }

    const records = await db
      .select()
      .from(table as Table)
      .where(config.where ?? eq(table.instituteId, profile.id));

    return {
      success: true as const,
      data: records,
    };
  } catch {
    return {
      success: false as const,
      error: "Failed to fetch records",
      details: {},
    };
  }
}

// ussage
// normal ussage------------
// const result = await readMany({
//   drizzleSchema: groups,
// });
// normal ussage------------

// Custom where ussage------------
// const result = await readMany({
//   drizzleSchema: groups,
//   where: eq(groups.status, true),
// });
// Custom where ussage------------

// Relational ussage------------
// const result = await readMany({
//   drizzleSchema: groups,
//   query: ({ db, instituteId }) =>
//     db.query.groups.findMany({
//       where: eq(groups.instituteId, instituteId),
//       with: {
//         groupClasses: {
//           with: {
//             class: true,
//           },
//         },
//       },
//     }),
// });
// Relational ussage------------
