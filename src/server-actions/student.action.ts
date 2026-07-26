"use server";
import { eq } from "drizzle-orm";
import { verifyUser } from "./verifyUser.action";
import { db } from "../db";
import { student } from "../db/schema/student.drizzle";
import { AddStudentType, addStudentZod } from "../validation/student.zod";

// get student
export async function getStudents() {
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
    const res = await db.query.student.findMany({
      where: eq(student.instituteId, info),
    });

    return {
      success: true,
      data: res,
    };
  } catch (error) {
    console.error("Database error in Student list:", error);

    return {
      success: false,
      error: "Failed to fetch student list.",
    };
  }
}

// add student
export async function addStudent(data: AddStudentType) {
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
  const validatedFields = addStudentZod.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed",
      details: errorMessages,
    };
  }

  try {
    const [newStudent] = await db
      .insert(student)
      .values({
        ...validatedFields.data,
        instituteId: profile.id,
      })
      .returning();

    return {
      success: true,
      data: newStudent,
    };
  } catch (error) {
    console.error("Database error during student creation:", error);
    return {
      success: false,
      error: "Failed to create student due to a database failure.",
    };
  }
}
