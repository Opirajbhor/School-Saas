"use server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { student } from "../db/schema/student.drizzle";
import { AddStudentType, addStudentZod } from "../validation/student.zod";
import { academicSessions } from "../db/schema";
import { enrollments } from "../db/schema/enrollments.drizzle";
import { requireInstitute } from "./get-institute-profile";
import { readMany } from "../lib/crud-funtions/server-read-crud";

// get student
export async function getStudents() {
  try {
    const result = await readMany({
      drizzleSchema: enrollments,
      query: ({ db, instituteId }) =>
        db.query.enrollments.findMany({
          where: eq(enrollments.instituteId, instituteId),
          with: {
            student: true,
            class: true,
            section: true,
            session: true,
            // groups: true,
          },
        }),
    });

    console.log(result.data);

    return {
      success: true as const,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
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

// register student

export async function addStudent(data: AddStudentType) {
  try {
    // Validate data
    const validated = addStudentZod.safeParse(data);
    if (!validated.success) {
      return {
        success: false as const,
        error: "Validation failed",
        details: validated.error.flatten().fieldErrors,
      };
    }
    const profile = await requireInstitute();

    // Use transaction
    const result = await db.transaction(async (tx) => {
      // Insert student
      const [newStudent] = await tx
        .insert(student)
        .values({
          instituteId: profile.id,
          studentId: data.studentId,
          englishName: data.englishName,
          fatherName: data.fatherName,
          motherName: data.motherName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          religion: data.religion,
          phone: data.phone,
          address: data.address,
          status: data.status,
          banglaName: data.banglaName,
          photoUrl: data.photoUrl || "",
          birthCertificateNo: data.birthCertificateNo,
        })
        .returning();

      // Insert enrollment - if this fails, student is rolled back
      const [enrollment] = await tx
        .insert(enrollments)
        .values({
          instituteId: profile.id,
          studentId: newStudent.id,
          sessionId: data.session,
          classId: data.className,
          sectionId: data.section,
          roll: data.roll,
        })
        .returning();

      return {
        ...newStudent,
        enrollment,
      };
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error("Failed to add student:", error);
    return {
      success: false as const,
      error: "Failed to create student and enrollment",
      details: {},
    };
  }
}
