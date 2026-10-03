"use server";

import { and, eq } from "drizzle-orm";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { readRecord } from "@/src/server-actions/crud-funtions/server-read-crud";
import { academicSessions } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import {
  academicSessionType,
  academicSessionZod,
} from "@/src/validation/academicSessions.zod";
import { createRecord } from "@/src/server-actions/crud-funtions/server-create-crud";
import { updateRecord } from "@/src/server-actions/crud-funtions/server-update-crud";
import { deleteRecord } from "@/src/server-actions/crud-funtions/server-delete-crud";
import { revalidatePath } from "next/cache";

export async function createAcademicSession(data: academicSessionType) {
  const validated = academicSessionZod.safeParse(data);
  if (!validated.success) {
    return {
      success: false as const,
      error: "Validation failed",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // If this session is active → deactivate others first
      if (validated.data) {
        await tx.update(academicSessions).set({ status: "INACTIVE" });
      }

      const [session] = await tx
        .insert(academicSessions)
        .values({
          ...validated.data,
          status: "ACTIVE",
        })
        .returning();

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

// update Sessions
export async function updateSessions(id: string, data: academicSessionType) {
  return updateRecord(
    {
      drizzleSchema: academicSessions,
      zodSchema: academicSessionZod,
      entity: "SESSION",
    },
    id,
    data,
  );
}

// delete session
export async function deleteSessions(id: string) {
  return deleteRecord(
    {
      drizzleSchema: academicSessions,
      entity: "SESSION",
    },
    id,
  );
}
