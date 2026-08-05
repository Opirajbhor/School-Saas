"use server";
import { eq } from "drizzle-orm";
import { verifyUser } from "./verifyUser.action";
import { db } from "../db";
import { student } from "../db/schema/student.drizzle";
import { AddStudentType, addStudentZod } from "../validation/student.zod";
import { academicSessions } from "../db/schema";
import { enrollments } from "../db/schema/enrollments.drizzle";
import { requireInstitute } from "./get-institute-profile";
import { parseWithZod } from "../validation/validator.zod";

// get student
export async function getStudents() {
  const { id } = await requireInstitute();

  try {
    const res = await db.query.student.findMany({
      where: eq(student.instituteId, id),
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

// get academicInfo
export async function getAcademicInfo() {
  const { id } = await requireInstitute();
  try {
    const academicInfo = await db.query.academicSessions.findMany({
      where: eq(academicSessions.instituteId, id),
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
  const profile = await requireInstitute();

  // parse with zod-----------------
  const validatedFields = parseWithZod(addStudentZod, data);
  if (!validatedFields.success) return validatedFields;
  // parse with zod-----------------

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
