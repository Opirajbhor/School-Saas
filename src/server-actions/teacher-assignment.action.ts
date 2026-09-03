"use server";
import { getTeacher } from "./teacher.action";
import { getClasses } from "./classes.action";
import {
  InputClassTeacherType,
  sectionClassTeacherZod,
} from "../validation/teacher-assignment.zod";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import { sectionClassTeachers } from "../db/schema/teacher-assignment.drizzle";
import { getActiveSessionId } from "./academicSession.action";
import { requireInstitute } from "./get-institute-profile";
import { readMany, readRecord } from "../lib/crud-funtions/server-read-crud";
import { and, eq } from "drizzle-orm";

//------------- get class, sections and teachers info -----------
export async function getClassWithTeacher() {
  try {
    const classData = await getClasses();
    const teacherInfo = await getTeacher();

    return {
      success: true as const,
      data: {
        classData,
        teacherInfo,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      success: false as const,
      error: "failed to get class and teacher info",
      details: {},
    };
  }
}

// --------- assign class Teacher --------------
export async function assignClassTeacher(data: InputClassTeacherType) {
  const profile = await requireInstitute();
  const activeSessionId = await getActiveSessionId(profile.id);
  return createRecord(
    {
      zodSchema: sectionClassTeacherZod,
      drizzleSchema: sectionClassTeachers,
      additionFields: { status: "ACTIVE", sessionId: activeSessionId },
    },
    data,
  );
}

// ------------get all assigned class Teacher ------------
export async function getassignedClassTeachers() {
  try {
    const result = await readMany({
      drizzleSchema: sectionClassTeachers,
      query: ({ db, instituteId }) =>
        db.query.sectionClassTeachers.findMany({
          where: and(eq(sectionClassTeachers.instituteId, instituteId)),
          with: {
            teacher: true,
            class: true,
            section: true,
          },
        }),
    });
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
