"use server";
import { classesDrizzle } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { eq } from "drizzle-orm";
import { classesType, classesZod } from "@/src/validation/classes.zod";

// create Class
export async function createAcademicClass(data: classesType) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: classesDrizzle,
        zodSchema: classesZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admin/academic-Class");
    revalidatePath("/dashboard/academic-Class");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicClass failed:", error);

    return {
      success: false as const,
      error: "Failed to create Class",
      details: {},
    };
  }
}

// change status of Class
export async function changeStatusClass(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.classesDrizzle.findFirst({
        where: eq(classesDrizzle.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(classesDrizzle)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(classesDrizzle.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-Class");
    revalidatePath("/dashboard/academic-Class");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicClass failed:", error);

    return {
      success: false as const,
      error: "Failed to create Class",
      details: {},
    };
  }
}

// delete Class
export async function deleteClass(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      return await tx
        .delete(classesDrizzle)
        .where(eq(classesDrizzle.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-Class");
    revalidatePath("/dashboard/academic-Class");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicClass failed:", error);

    return {
      success: false as const,
      error: "Failed to create Class",
      details: {},
    };
  }
}
