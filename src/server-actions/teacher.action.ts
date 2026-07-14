"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import { addTeacherType, addTeacherZod } from "../validation/teacher.zod";
import { teachers } from "../db/schema/teacher.drizzle";
import { and, eq } from "drizzle-orm";

export async function addTeacher(data: addTeacherType) {
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const profile = verify.profile;
  const validatedFields = addTeacherZod.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed",
      details: errorMessages,
    };
  }
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
      success: true,
      data: newTeacher,
    };
  } catch (error) {
    console.error("Database error during teacher creation:", error);
    return {
      success: false,
      error: "Failed to create teacher account due to a database failure.",
    };
  }
}
// getTeacher
export async function getTeacher() {
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const info = verify.profile.id;
  try {
    const data = await db.query.teachers.findMany({
      where: eq(teachers.instituteId, info),
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
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const info = verify.profile.id;
  try {
    const [totalTeachers, activeTeachers, maleTeachers, femaleTeachers] =
      await Promise.all([
        db.$count(teachers, eq(teachers.instituteId, info)),

        db.$count(
          teachers,
          and(eq(teachers.instituteId, info), eq(teachers.status, "ACTIVE")),
        ),
        db.$count(
          teachers,
          and(eq(teachers.instituteId, info), eq(teachers.gender, "MALE")),
        ),
        db.$count(
          teachers,
          and(eq(teachers.instituteId, info), eq(teachers.gender, "FEMALE")),
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
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const instituteId = verify.profile.id;
  try {
    // find teacher
    const teacher = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.id, teacherId),
        eq(teachers.instituteId, instituteId),
      ),
    });
    if (!teacher) {
      return {
        success: false,
        error: "Teacher not found.",
      };
    }
    await db
      .delete(teachers)
      .where(
        and(eq(teachers.id, teacherId), eq(teachers.instituteId, instituteId)),
      );
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
