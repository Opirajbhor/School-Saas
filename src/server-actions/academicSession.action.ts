"use server";
import { db } from "../db";
import {
  academicSessionType,
  academicSessionZod,
} from "../validation/academicSessions.zod";
import { academicSessions } from "../db/schema/academic-session.drizzle";
import { and, eq } from "drizzle-orm";
import { requireInstitute } from "./get-institute-profile";
import { revalidatePath } from "next/cache";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";

// post
export async function createSession(data: academicSessionType) {
  return createRecord(
    {
      zodSchema: academicSessionZod,
      drizzleSchema: academicSessions,
      additionFields: { isActive: false },
    },
    data,
  );
}
// get
export async function getAcademicSession() {
  const profile = await requireInstitute();
  const info = profile?.id;
  try {
    const data = await db.query.academicSessions.findMany({
      where: eq(academicSessions.instituteId, info),
    });

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Database error in Academic Session list:", error);
    throw new Error("Failed to fetch Academic Session list.");
  }
}
// get active session id
export async function getActiveSessionId(instituteId: string) {
  const session = await db.query.academicSessions.findFirst({
    where: and(
      eq(academicSessions.instituteId, instituteId),
      eq(academicSessions.isActive, true),
    ),
    columns: {
      id: true,
    },
  });

  if (!session) throw new Error("No active session found");

  return session.id;
}
// delete session
export async function deleteSession(classId: string) {
  const { id } = await requireInstitute();
  try {
    const result = await db
      .delete(academicSessions)
      .where(
        and(
          eq(academicSessions.id, classId),
          eq(academicSessions.instituteId, id),
        ),
      )
      .returning({
        id: academicSessions.id,
      });

    if (result.length === 0) {
      return {
        success: false,
        error: "Class not found.",
      };
    }
    revalidatePath("/dashboard/*");
    revalidatePath("/dashboard/");
    revalidatePath("/dashboard/classes");
    return {
      success: true,
      message: "Session deleted successfully.",
    };
  } catch (error) {
    console.error("Delete Session error:", error);

    return {
      success: false,
      error: "Failed to delete Session.",
    };
  }
}

// --
export async function deleteSessions(id: string) {
  return deleteRecord(
    {
      drizzleSchema: academicSessions,
    },
    id,
  );
}
