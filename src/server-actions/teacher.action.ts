"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import {
  addTeacherType,
  addTeacherZod,
  editTeacherType,
} from "../validation/teacher.zod";
import { teachers } from "../db/schema/teacher.drizzle";
import { and, eq } from "drizzle-orm";
import { requireInstitute } from "./get-institute-profile";
import { parseWithZod } from "../validation/validator.zod";

// add teacher
export async function addTeacher(data: addTeacherType) {
  const profile = await requireInstitute();
  // parse with zod-----------------
  const validatedFields = parseWithZod(addTeacherZod, data);
  if (!validatedFields.success) return validatedFields;
  // parse with zod-----------------

  try {
    const [newTeacher] = await db
      .insert(teachers)
      .values({
        ...validatedFields.data,
        instituteId: profile.id,
        userId: profile.userId,
      })
      .returning();

    return {
      success: true as const,
      data: newTeacher,
    };
  } catch (error) {
    console.error("Database error during teacher creation:", error);
    return {
      success: false as const,
      error: "Failed to create teacher account due to a database failure.",
      details: {},
    };
  }
}
// getTeacher
export async function getTeacher() {
  const { id } = await requireInstitute();

  try {
    const data = await db.query.teachers.findMany({
      where: eq(teachers.instituteId, id),
    });

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Database error in Teachers list:", error);
    throw new Error("Failed to fetch Teachers list.");
  }
}

// get teacher stats
export async function getTeacherStats() {
  const { id } = await requireInstitute();

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
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch teacher stats",
    };
  }
}

// delete teacher
export async function deleteTeacher(teacherId: string) {
  const { id } = await requireInstitute();

  try {
    // find teacher
    const teacher = await db.query.teachers.findFirst({
      where: and(eq(teachers.id, teacherId), eq(teachers.instituteId, id)),
    });
    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found.",
      };
    }
    await db
      .delete(teachers)
      .where(and(eq(teachers.id, teacherId), eq(teachers.instituteId, id)));
    return {
      success: true,
      message: "Teacher deleted successfully.",
    };
  } catch (error) {
    console.error("Delete teacher error:", error);

    return {
      success: false,
      error: "Failed to delete teacher.",
    };
  }
}

// edit teacher
export async function editTeacher(data: editTeacherType) {
  const { id } = await requireInstitute();

  try {
    // find teacher
    const teacher = await db.query.teachers.findFirst({
      where: and(eq(teachers.id, data.id), eq(teachers.instituteId, id)),
    });
    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found.",
      };
    }
    await db
      .update(teachers)
      .set({
        ...data,
      })
      .where(and(eq(teachers.id, data.id), eq(teachers.instituteId, id)))
      .returning();
    return {
      success: true,
      message: "Teacher updated successfully.",
    };
  } catch (error) {
    console.error("edit teacher error:", error);

    return {
      success: false,
      error: "Failed to edit teacher info.",
    };
  }
}
