"use server";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { eq } from "drizzle-orm";
import { addGroupZod, inputGroupType } from "@/src/validation/groups.zod";
import { groups } from "@/src/drizzle-DB/schema";

// create Groups
export async function createAcademicGroups(data: inputGroupType) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: groups,
        zodSchema: addGroupZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admin/academic-Groups");
    revalidatePath("/dashboard/academic-Groups");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicGroups failed:", error);

    return {
      success: false as const,
      error: "Failed to create Groups",
      details: {},
    };
  }
}

// change status of Groups
export async function changeStatusGroups(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.groups.findFirst({
        where: eq(groups.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(groups)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(groups.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-Groups");
    revalidatePath("/dashboard/academic-Groups");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicGroups failed:", error);

    return {
      success: false as const,
      error: "Failed to create Groups",
      details: {},
    };
  }
}

// delete Groups
export async function deleteGroups(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      return await tx.delete(groups).where(eq(groups.id, id)).returning();
    });
    revalidatePath("/super-admin/academic-Groups");
    revalidatePath("/dashboard/academic-Groups");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicGroups failed:", error);

    return {
      success: false as const,
      error: "Failed to create Groups",
      details: {},
    };
  }
}
