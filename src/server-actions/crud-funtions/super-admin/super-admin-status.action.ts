import { db } from "@/src/drizzle-DB";
import { eq, Table } from "drizzle-orm";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";

type StatusTable = PgTable & {
  
  id: PgColumn;
  status: PgColumn;
};

export type StatusConfig<T extends StatusTable> = {
  drizzleSchema: T;
};

export async function statusChangeSuperAdmin<T extends StatusTable>(
  
  config: StatusConfig<T>,
  id: string,
) {
  try {
    const table = config.drizzleSchema;

    const [record] = await db
      .select()
      .from(table as Table)
      .where(eq(table.id, id))
      .limit(1);

    if (!record) {
      return {
        success: false as const,
        error: "Record not found",
        details: {},
      };
    }

    const newStatus = record.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const [updated] = await db
      .update(table as unknown as Table)
      .set({ status: newStatus })
      .where(eq(table.id, id))
      .returning();

    return {
      success: true as const,
      data: updated,
    };
  } catch (error) {
    console.error("Status toggle failed:", error);
    return {
      success: false as const,
      error: "Failed to update status",
      details: {},
    };
  }
}
