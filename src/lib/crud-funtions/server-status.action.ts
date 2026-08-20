import { db } from "@/src/db";
import { requireInstitute } from "@/src/server-actions/get-institute-profile";
import { and, eq, Table } from "drizzle-orm";
import { DeleteConfig, InstituteTable } from "./server-delete-crud";
import { PgColumn } from "drizzle-orm/pg-core";

type StatusTable = InstituteTable & {
  id: PgColumn;
  instituteId: PgColumn;
  status: PgColumn;
};

export async function toggleStatus<T extends StatusTable>(
  config: DeleteConfig<T>,
  id: string,
) {
  try {
    const profile = await requireInstitute();
    const table = config.drizzleSchema;

    const [record] = await db
      .select()
      .from(table as Table)
      .where(and(eq(table.id, id), eq(table.instituteId, profile.id)))
      .limit(1);

    if (!record) {
      return {
        success: false as const,
        error: "Record not found",
        details: {},
      };
    }

    const newStatus =
      typeof record.status === "boolean"
        ? !record.status
        : record.status === "ACTIVE"
          ? "INACTIVE"
          : "ACTIVE";

    const [updated] = await db
      .update(table)
      .set({
        status: newStatus,
      } as Partial<T["$inferInsert"]>)
      .where(and(eq(table.id, id), eq(table.instituteId, profile.id)))
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
