"use server";
import { academicSessions } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import {
  academicSessionType,
  academicSessionZod,
} from "@/src/validation/academicSessions.zod";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { eq } from "drizzle-orm";

// create session
export async function createAcademicSession(data: academicSessionType) {
  try {
    const result = await db.transaction(async (tx) => {
      if (data) {
        await tx.update(academicSessions).set({ status: "INACTIVE" });
      }

      const session = await CreateSuperAdmin(
        {
          drizzleSchema: academicSessions,
          zodSchema: academicSessionZod,
          additionFields: {},
        },
        data,
      );

      return session;
    });
    revalidatePath("/super-admin/academic-sessions");
    revalidatePath("/dashboard/academic-sessions");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicSession failed:", error);

    return {
      success: false as const,
      error: "Failed to create session",
      details: {},
    };
  }
}

// change status of Session
export async function changeStatusSession(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      await tx.update(academicSessions).set({ status: "INACTIVE" });

      return await tx
        .update(academicSessions)
        .set({ status: "ACTIVE" })
        .where(eq(academicSessions.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-sessions");
    revalidatePath("/dashboard/academic-sessions");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicSession failed:", error);

    return {
      success: false as const,
      error: "Failed to create session",
      details: {},
    };
  }
}

// delete session
export async function deleteSession(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      return await tx
        .delete(academicSessions)
        .where(eq(academicSessions.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-sessions");
    revalidatePath("/dashboard/academic-sessions");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicSession failed:", error);

    return {
      success: false as const,
      error: "Failed to create session",
      details: {},
    };
  }
}
