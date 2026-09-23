"use server";
import {
  ClassSectionType,
  classSubjectGroupType,
  ClassSubjectType,
  classTeacherType,
  InputClassTeacherType,
  InputSubjectTeacherType,
  OutputSubjectTeacher,
  sectionClassTeacherZod,
  subjectTeacherZod,
} from "../../../../src/validation/teacher-assignment.zod";
import { createRecord } from "../../../../src/server-actions/crud-funtions/server-create-crud";
import {
  sectionClassTeachers,
  sectionSubjectTeachers,
} from "../../../../src/drizzle-DB/schema/teacher-assignment.drizzle";
import { getActiveSessionId } from "../../academic-sessions/_actions/academicSession.action";
import { and, eq } from "drizzle-orm";
import { deleteRecord } from "../../../../src/server-actions/crud-funtions/server-delete-crud";
import {
  classesDrizzle,
  groupClasses,
  subjectAssignSchema,
} from "../../../../src/drizzle-DB/schema";
import { Teacherlist } from "../../../../src/validation/teacher.zod";
import {
  classesTypeWithId,
  ClassWithSectionType,
} from "../../../../src/validation/classes.zod";
import { db } from "../../../../src/drizzle-DB";
import { updateRecord } from "../../../../src/server-actions/crud-funtions/server-update-crud";
import {
  getClassAndSection,
  getClasses,
} from "../../classes/_actions/classes.action";
import { getTeacher } from "../../teachers/_actions/teacher.action";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";

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
  const activeSessionId = await getActiveSessionId();
  if (!activeSessionId.success) {
    return {
      success: false as const,
      error: "failed to get active academic session",
      details: {},
    };
  }
  const sessionId = activeSessionId.success && activeSessionId.data;
  const newId = await createRecord(
    {
      zodSchema: sectionClassTeacherZod,
      drizzleSchema: sectionClassTeachers,
      additionFields: { status: "ACTIVE", sessionId },
      entity: "TEACHER",
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

// ---------------- delete assign class teacher --------
export async function deleteAssignTeacher(id: string) {
  return deleteRecord(
    {
      drizzleSchema: sectionClassTeachers,
      entity: "TEACHER",
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

// --------- assign new subject Teacher --------------
export async function assignSubjectTeacher(data: InputSubjectTeacherType) {
  const ctx = await getUserContext();

  if (!ctx) {
    return {
      success: false as const,
      error: "No User session foundF",
      details: {},
    };
  }
  const { instituteId } = ctx;
  const activeSessionId = await getActiveSessionId();
  if (!activeSessionId.success) {
    return {
      success: false as const,
      error: "failed to get active academic session",
      details: {},
    };
  }
  const sessionId = activeSessionId.success && activeSessionId.data;

  try {
    const checkData = await db
      .select()
      .from(sectionSubjectTeachers)
      .where(
        and(
          eq(sectionSubjectTeachers.instituteId, instituteId),
          eq(sectionSubjectTeachers.sessionId, sessionId),
          eq(sectionSubjectTeachers.sectionId, data.sectionId),
          eq(sectionSubjectTeachers.subjectId, data.subjectId),
        ),
      )
      .limit(1);
    // -----if subject already assinged----------
    const existing = checkData[0] ?? null;
    if (existing) {
      if (existing.teacherId === data.teacherId) {
        return {
          success: false as const,
          error: "Same teacher can not be assigned again",
          details: {},
        };
      }

      const updateData = await updateRecord(
        {
          drizzleSchema: sectionSubjectTeachers,
          zodSchema: subjectTeacherZod,
          entity: "TEACHER",
        },
        existing.id,
        data,
      );
      return {
        success: true as const,
        data: updateData,
      };
    }

    // ----------create new record ------------
    const newId = await createRecord(
      {
        zodSchema: subjectTeacherZod,
        drizzleSchema: sectionSubjectTeachers,
        additionFields: { status: "ACTIVE", sessionId },
        entity: "TEACHER",
      },
      data,
    );
    return {
      success: true as const,
      data: newId,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to assign Teacher",
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

// ------------- get class section all subjects -------------
export async function getSingleClassSubjects(data: classSubjectGroupType) {
  const { classId, sectionId } = data;
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
            eq(sectionSubjectTeachers.sectionId, sectionId),
          ),
          with: {
            subject: true,
            teacher: true,
          },
        }),
    });
    const allTeachers = await getTeacher();
    const classData = await getClassAndSection({ classId, sectionId });

    if (
      !assignedSubjects.success ||
      !assignedSubjects.success ||
      !allTeachers.success ||
      !classData.success
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
        teacherName: assignment?.teacher.nameEnglish ?? null,
      };
    });

    // -----------get all teacher data--------------

    return {
      success: true as const,
      data: {
        tableData,
        teachers: allTeachers.data as Teacherlist[],
        class: classData.data[0] as ClassWithSectionType,
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
