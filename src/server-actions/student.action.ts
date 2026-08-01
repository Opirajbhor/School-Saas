"use server";
import { eq } from "drizzle-orm";
import { verifyUser } from "./verifyUser.action";
import { db } from "../db";
import { student } from "../db/schema/student.drizzle";
import { AddStudentType, addStudentZod } from "../validation/student.zod";
import { academicSessions } from "../db/schema";
import { enrollments } from "../db/schema/enrollments.drizzle";

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

export async function getAcademicInfo() {
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
    const academicInfo = await db.query.academicSessions.findMany({
      where: eq(academicSessions.instituteId, info),
      with: {
        classes: {
          with: {
            sections: true,
          },
        },
      },
    });
    return {
      success: true,
      data: academicInfo.find((s) => s.isActive),
    };
  } catch {
    console.error("failed to get the Academic Info");
    return {
      success: false,
      error: "Failed to fetch list.",
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
  const { session, className, roll, section, ...studentInfo } = data;
  try {
    const [newStudent] = await db
      .insert(student)
      .values({
        ...studentInfo,
        instituteId: profile.id,
      })
      .returning();

    await db.insert(enrollments).values({
      instituteId: profile.id,
      studentId: newStudent.id,
      sessionId: session,
      classId: className,
      sectionId: section,
      roll: roll,
    });

    const fullStudentData = await db.query.student.findFirst({
      where: eq(student.id, newStudent.id),
      with: {
        enrollments: {
          with: {
            session: true,
            class: true,
            section: true,
          },
        },
      },
    });

    return {
      success: true,
      data: fullStudentData,
    };
  } catch (error) {
    console.error("Database error during student creation:", error);
    return {
      success: false,
      error: "Failed to create student due to a database failure.",
    };
  }
}
