"use server";
import { getTeacher } from "./teacher.action";
import { getClasses } from "./classes.action";
import {
  ClassSectionType,
  classSubjectGroupType,
  ClassSubjectType,
  classTeacherType,
  InputClassTeacherType,
  OutputClassTeacherType,
  OutputSubjectTeacher,
  sectionClassTeacherZod,
} from "../validation/teacher-assignment.zod";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import {
  sectionClassTeachers,
  sectionSubjectTeachers,
} from "../db/schema/teacher-assignment.drizzle";
import { getActiveSessionId } from "./academicSession.action";
import { requireInstitute } from "./get-institute-profile";
import { readMany } from "../lib/crud-funtions/server-read-crud";
import { and, eq } from "drizzle-orm";
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";
import {
  classesDrizzle,
  groupClasses,
  subjectAssignSchema,
} from "../db/schema";
import { Teacherlist } from "../validation/teacher.zod";
import { classesTypeWithId } from "../validation/classes.zod";

// ---------------- class teacher ---------------

//------------- get class, sections and teachers info -----------
export async function getClassWithTeacher() {
  try {
    const classData = await getClasses();
    const teacherInfo = await getTeacher();

    return {
      success: true as const,
      data: {
        classData: classData.data as classesTypeWithId[],
        teacherInfo: teacherInfo.data as Teacherlist[],
      },
    };
  } catch (error) {
    console.error(error);
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
  const newId = await createRecord(
    {
      zodSchema: sectionClassTeacherZod,
      drizzleSchema: sectionClassTeachers,
      additionFields: { status: "ACTIVE", sessionId: activeSessionId },
    },
    data,
  );
  if (newId.success) {
    try {
      const result = await readMany({
        drizzleSchema: sectionClassTeachers,
        query: ({ db, instituteId }) =>
          db.query.sectionClassTeachers.findMany({
            where: and(
              eq(sectionClassTeachers.instituteId, instituteId),
              eq(sectionClassTeachers.id, newId.data.id as string),
            ),
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
  } else {
    return {
      success: false as const,
      error: "failed to assign Teacher",
      details: {},
    };
  }
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
      data: result.data as classTeacherType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// ---------------- delete assign teacher
export async function deleteAssignTeacher(id: string) {
  return deleteRecord(
    {
      drizzleSchema: sectionClassTeachers,
    },
    id,
  );
}

// ---------------- subject teacher ---------------
// ------------------get only active Classes, section, groups----------------
export async function getActiveClassesSection() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: and(
            eq(classesDrizzle.instituteId, instituteId),
            eq(classesDrizzle.status, "ACTIVE"),
          ),
          with: {
            sections: {
              where: eq(classesDrizzle.status, "ACTIVE"),
            },
            groupClasses: {
              where: eq(classesDrizzle.status, "ACTIVE"),
              with: {
                group: true,
              },
            },
          },
        }),
    });
    return {
      success: true as const,
      data: result.data as ClassSectionType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// ------------get assigned groups to classes ---------------
export async function getActiveAssignGroup() {
  try {
    const result = await readMany({
      drizzleSchema: groupClasses,
      query: ({ db, instituteId }) =>
        db.query.groupClasses.findMany({
          where: and(
            eq(groupClasses.instituteId, instituteId),
            eq(groupClasses.status, "ACTIVE"),
          ),
          with: {
            group: true,
          },
        }),
    });
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to fetch data",
      details: {},
    };
  }
}

// ------------- get class subjects -------------
export async function getSingleClassSubjects(data: classSubjectGroupType) {
  const { classId } = data;
  try {
    const assignedSubjects = await readMany({
      drizzleSchema: subjectAssignSchema,
      query: ({ db, instituteId }) =>
        db.query.subjectAssignSchema.findMany({
          where: and(
            eq(subjectAssignSchema.instituteId, instituteId),
            eq(subjectAssignSchema.classId, classId),
          ),
          with: {
            subject: true,
          },
        }),
    });
    const assignedTeachers = await readMany({
      drizzleSchema: sectionSubjectTeachers,
      query: ({ db, instituteId }) =>
        db.query.sectionSubjectTeachers.findMany({
          where: and(
            eq(sectionSubjectTeachers.instituteId, instituteId),
            eq(sectionSubjectTeachers.sectionId, data.sectionId),
          ),
          with: {
            subject: true,
          },
        }),
    });
    const allTeachers = await getTeacher();

    if (
      !assignedSubjects.success ||
      !assignedSubjects.success ||
      !allTeachers.success
    ) {
      return {
        success: false as const,
        error: "failled to get Section Data",
        details: {},
      };
    }

    const subjects = (assignedSubjects?.data as ClassSubjectType[]) ?? [];
    const teachers = (assignedTeachers?.data as OutputSubjectTeacher[]) ?? [];

    // -------merging both arrays---------
    const tableData = subjects.map((subject) => {
      const assignment = teachers.find(
        (t) => t.subjectId === subject.subjectId,
      );
      return {
        ...subject,
        teacherId: assignment?.teacherId ?? null,
        teacherName: assignment?.teacherName ?? null,
      };
    });

    // -----------get all teacher data--------------

    return {
      success: true as const,
      data: {
        tableData,
        teachers: allTeachers.data as Teacherlist[],
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}
