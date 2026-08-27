"use server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { student } from "../db/schema/student.drizzle";
import { AddStudentType, addStudentZod } from "../validation/student.zod";
import { academicSessions } from "../db/schema";
import { enrollments } from "../db/schema/enrollments.drizzle";
import { requireInstitute } from "./get-institute-profile";
import { createRecord } from "../lib/crud-funtions/server-create-crud";

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

// register student
export async function addStudent(data: AddStudentType) {
  const result = await createRecord(
    {
      zodSchema: addStudentZod.omit({
        session: true,
        className: true,
        section: true,
        roll: true,
      }),
      drizzleSchema: student,
      beforeCrud: async ({ data }) => {
        const studentInfo = {
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
          photoUrl: data.photoUrl,
          birthCertificateNo: data.birthCertificateNo,
        };
        return studentInfo;
      },

      additionFields: {},
    },
    data,
  );
  if (result.success && result.data) {
    const studentData = result.data as AddStudentType;
    await db
      .insert(enrollments)
      .values({
        instituteId: studentData.instituteId,
        studentId: studentData.id,
        sessionId: "aafcd386-d021-4a95-9ed7-252a47ff1b72",
        classId: "c4cb091f-7c3d-4e80-bfcf-503c7adac4d5",
        sectionId: "cbe057c0-5d9f-49ba-bd18-846061c7e4e9",
        roll: data.roll,
      })
      .returning();
    const studentId = result.data.id as string;
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .limit(1);
    return {
      ...result,
      enrollment,
    };
  }
  return result;
}
