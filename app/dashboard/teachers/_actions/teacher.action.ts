"use server";

import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { headers } from "next/headers";
import {
  addTeacherType,
  addTeacherZod,
  editTeacherType,
  editTeacherZod,
  Teacherlist,
} from "@/src/validation/teacher.zod";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import { teachers } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";
import { updateRecord } from "@/src/server-actions/crud-funtions/server-update-crud";
import { deleteRecord } from "@/src/server-actions/crud-funtions/server-delete-crud";

// add teacher
export async function addTeacher(data: addTeacherType) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { instituteId, userId } = ctx;
  // parse with zod-----------------
  const validatedFields = parseWithZod(addTeacherZod, data);
  if (!validatedFields.success) return validatedFields;
  //--------- create user then teacher info---------
  try {
    const newUser = await auth.api.createUser({
      headers: await headers(),
      body: {
        email: validatedFields.data.email,
        password: validatedFields.data.password,
        name: validatedFields.data.nameEnglish,
        role: "user",
      },
    });
    if (!newUser?.user) {
      return {
        success: false as const,
        error: "Failed to create account",
        details: {},
      };
    }
    const dbTxn = await db.transaction(async (tx) => {
      const [teacher] = await tx
        .insert(teachers)
        .values({
          ...validatedFields.data,
          instituteId,
          userId: newUser.user.id,
        })
        .returning();

      // =========audit logs==========
      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "CREATED",
        entity: "TEACHER",
        entityId: teacher.id,
      });
    });
    return {
      success: true as const,
      data: dbTxn,
    };
  } catch (error) {
    console.error("Database error during teacher creation", error);
    return {
      success: false as const,
      error: "Failed to create teacher account due to a database failure.",
      details: {},
    };
  }
}
// getTeacher
export async function getTeacher() {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
    };
  }
  const { instituteId } = ctx;

  try {
    const data = await db.query.teachers.findMany({
      where: eq(teachers.instituteId, instituteId),
    });

    return {
      success: true as const,
      data: data as Teacherlist[],
    };
  } catch (error) {
    console.error("Database error in Teachers list:", error);
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// get teacher stats
export async function getTeacherStats() {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
    };
  }
  const { instituteId: id } = ctx;

  try {
    const [totalTeachers, activeTeachers, maleTeachers, femaleTeachers] =
      await Promise.all([
        db.$count(teachers, eq(teachers.instituteId, id)),

        db.$count(
          teachers,
          and(eq(teachers.instituteId, id), eq(teachers.status, "ACTIVE")),
        ),
        db.$count(
          teachers,
          and(eq(teachers.instituteId, id), eq(teachers.gender, "MALE")),
        ),
        db.$count(
          teachers,
          and(eq(teachers.instituteId, id), eq(teachers.gender, "FEMALE")),
        ),
      ]);

    return {
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        maleTeachers,
        femaleTeachers,
      },
    };
  } catch {
    return {
      success: false,
      error: "Failed to fetch teacher stats",
    };
  }
}

// delete teacher
export async function deleteTeacher(teacherId: string) {
  return await deleteRecord(
    {
      drizzleSchema: teachers,
      entity: "TEACHER",
    },
    teacherId,
  );
}

// edit teacher

export async function editTeacher(id: string, data: editTeacherType) {
  console.log("------updating-----------");

  return await updateRecord(
    {
      drizzleSchema: teachers,
      zodSchema: editTeacherZod,
      entity: "TEACHER",
    },
    id,
    data,
  );
}
