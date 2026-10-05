"use server";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { eq } from "drizzle-orm";
import {
  InputSubjectType,
  inputSubjectZod,
} from "@/src/validation/subjects.zod";
import { subjectDbSchema } from "@/src/drizzle-DB/schema";

// create subjects
export async function createAcademicsubjects(data: InputSubjectType) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: subjectDbSchema,
        zodSchema: inputSubjectZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admin/academic-subjects");
    revalidatePath("/dashboard/academic-subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicsubjects failed:", error);
    return {
      success: false as const,
      error: "Failed to create subjects",
      details: {},
    };
  }
}

// change status of subjects
export async function changeStatussubjects(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.subjectDbSchema.findFirst({
        where: eq(subjectDbSchema.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(subjectDbSchema)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(subjectDbSchema.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-subjects");
    revalidatePath("/dashboard/academic-subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicsubjects failed:", error);

    return {
      success: false as const,
      error: "Failed to create subjects",
      details: {},
    };
  }
}

// delete subjects
export async function deletesubjects(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      return await tx
        .delete(subjectDbSchema)
        .where(eq(subjectDbSchema.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-subjects");
    revalidatePath("/dashboard/academic-subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicsubjects failed:", error);

    return {
      success: false as const,
      error: "Failed to create subjects",
      details: {},
    };
  }
}
