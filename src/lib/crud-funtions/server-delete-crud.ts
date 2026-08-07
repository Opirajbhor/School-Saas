import type { PgTable } from "drizzle-orm/pg-core";
import { AnyColumn, and, eq } from "drizzle-orm";
import { requireInstitute } from "@/src/server-actions/get-institute-profile";
import { db } from "@/src/db";

type InstituteTable = PgTable & {
  id: AnyColumn;
  instituteId: AnyColumn;
};

type DeleteConfig<T extends InstituteTable> = {
  drizzleSchema: T;
};

export async function deleteRecord<T extends InstituteTable>(
  config: DeleteConfig<T>,
  id: string,
) {
  try {
    const profile = await requireInstitute();

    const [record] = await db
      .delete(config.drizzleSchema)
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

    return {
      success: true as const,
      data: record,
    };
  } catch (error) {
    console.error("Delete failed:", error);

    return {
      success: false as const,
      error: "Failed to delete record",
      details: {},
    };
  }
}

// export async function deleteSession(id: string) {
//   return deleteRecord(
//     {
//       drizzleSchema: academicSessions,
//     },
//     id,
//   );
// }
