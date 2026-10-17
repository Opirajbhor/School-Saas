"use server";
import {
  examAssignZod,
  examClassSearchType,
  examGradeRangeZod,
  examMarkTypesZod,
  InputExamGradeRangeType,
  InputExamMarkType,
  InputExamMarkTypes,
  OutputExamGradeRangeType,
  OutputExamMarkTypes,
} from "../_schema/exam.zod";
import {
  examClasses,
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  exams,
  subjectAssignSchema,
} from "@/src/drizzle-DB/schema";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { db } from "@/src/drizzle-DB";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import {
  examZod,
  InputExamType,
  OutputExamType,
} from "@/app/dashboard/exam/_schema/exam.zod";
import {
  ClassesSubjectsType,
  ClassSubjectRowType,
} from "@/src/validation/subjects.zod";

// =============== Exam ================
export async function getDefaultExams() {
  try {
    const result = await readMany({
      drizzleSchema: exams,
      query: ({ db }) =>
        db.query.exams.findMany({
          where: isNull(exams.instituteId),
          with: {
            assignClasses: {
              with: {
                class: true,
              },
            },
          },
          orderBy: (exams, { asc }) => [asc(exams.createdAt)],
        }),
    });

    const rawData = result.data as OutputExamType[];
    const data = rawData.map((exam) => ({
      ...exam,
      assignClasses: exam.assignClasses
        .filter((ex) => ex?.status === "ACTIVE")
        .map((ex) => ({
          ...ex,
          class: ex.class ?? null,
        })),
    }));
    return {
      success: true as const,
      data: data as OutputExamType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// post exam
export async function postExams(data: InputExamType) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: exams,
        zodSchema: examZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admn/exam/create");
    revalidatePath("/dashboard/exam/create");

    return { success: true as const, data: result };
  } catch (error) {
    console.error("create exam failed:", error);

    return {
      success: false as const,
      error: "Failed to create exam",
      details: {},
    };
  }
}

export async function ToggleExamStatus(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.exams.findFirst({
        where: eq(exams.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(exams)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(exams.id, id))
        .returning();
    });
    revalidatePath("/super-admn/exam/create");
    revalidatePath("/dashboard/exam/create");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("change exam  status failed:", error);

    return {
      success: false as const,
      error: "change exam status failed",
      details: {},
    };
  }
}
// =============== assign exams ==================
// assign to class
export async function assignExamToClasses(data: InputExamMarkType) {
  const validation = examAssignZod.safeParse(data);
  if (!validation.success) {
    return {
      success: false as const,
      error: "Invalid data",
      details: validation.error.flatten().fieldErrors,
    };
  }
  const { examId, classIds } = validation.data;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Deactivate all existing classes in the group
      await tx
        .update(examClasses)
        .set({ status: "INACTIVE" })
        .where(eq(examClasses.examId, examId));

      const existingAssignments = await tx.query.examClasses.findMany({
        where: eq(examClasses.examId, examId),
      });

      const existingClassIdSet = new Set(
        existingAssignments.map((item) => item.classId),
      );

      // Reactivate existing classes
      if (classIds.length > 0) {
        await tx
          .update(examClasses)
          .set({ status: "ACTIVE" })
          .where(
            and(
              inArray(examClasses.classId, classIds),
              eq(examClasses.examId, examId),
            ),
          );
      }

      // Create new class assignments
      const newClassIds = classIds.filter((id) => !existingClassIdSet.has(id));

      if (newClassIds.length > 0) {
        await tx.insert(examClasses).values(
          newClassIds.map((classId) => ({
            examId,
            classId,
            status: "ACTIVE" as const,
          })),
        );
      }
      revalidatePath("/super-admin/exam");
      revalidatePath("/super-admin/exam/create");
      revalidatePath("/dashboard/exam");
    });
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to update group assignment",
      details: {},
    };
  }
}

//=================  exam mark types ==============

// get Default exam mark types
export async function getDefaultMarkTypes() {
  try {
    const result = await readMany({
      drizzleSchema: examMarkTypesDrizzle,
      query: ({ db }) =>
        db.query.examMarkTypesDrizzle.findMany({
          where: isNull(examMarkTypesDrizzle.instituteId),
          orderBy: (examMarkTypesDrizzle, { asc }) => [
            asc(examMarkTypesDrizzle.createdAt),
          ],
        }),
    });
    return {
      success: true as const,
      data: result.data as OutputExamMarkTypes[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}
//======== post exam mark types ========

export async function postMarkTypes(data: InputExamMarkTypes) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: examMarkTypesDrizzle,
        zodSchema: examMarkTypesZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admn/exam/mark-types");
    revalidatePath("/dashboard/exam/mark-types");

    return { success: true as const, data: result };
  } catch (error) {
    console.error("create exam failed:", error);

    return {
      success: false as const,
      error: "Failed to create exam",
      details: {},
    };
  }
}

//======== toogleStatus exam mark types ========
export async function ToggleExamtypeStatus(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.examMarkTypesDrizzle.findFirst({
        where: eq(examMarkTypesDrizzle.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(examMarkTypesDrizzle)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(examMarkTypesDrizzle.id, id))
        .returning();
    });
    revalidatePath("/super-admn/exam/mark-types");
    revalidatePath("/dashboard/exam/mark-types");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("change exam type status failed:", error);

    return {
      success: false as const,
      error: "change exam type status failed",
      details: {},
    };
  }
}

//========================= post exam Grade Ranges ======================

// get Default exam mark types
export async function getDefaultGradeRange() {
  try {
    const result = await readMany({
      drizzleSchema: examGradeRangeDrizzle,
      query: ({ db }) =>
        db.query.examGradeRangeDrizzle.findMany({
          where: isNull(examGradeRangeDrizzle.instituteId),
          orderBy: (examGradeRangeDrizzle, { asc }) => [
            asc(examGradeRangeDrizzle.createdAt),
          ],
        }),
    });
    return {
      success: true as const,
      data: result.data as OutputExamGradeRangeType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

//======== post exam Grade Ranges ========

export async function postGradeRange(data: InputExamGradeRangeType) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: examGradeRangeDrizzle,
        zodSchema: examGradeRangeZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admn/exam/grade-ranges");
    revalidatePath("/dashboard/exam/grade-ranges");

    return { success: true as const, data: result };
  } catch (error) {
    console.error("create exam failed:", error);

    return {
      success: false as const,
      error: "Failed to create exam",
      details: {},
    };
  }
}

//======== toogleStatus exam grade ranges ========

export async function ToggleGradeRangeStatus(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.examGradeRangeDrizzle.findFirst({
        where: eq(examGradeRangeDrizzle.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(examGradeRangeDrizzle)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(examGradeRangeDrizzle.id, id))
        .returning();
    });
    revalidatePath("/super-admn/exam/grade-ranges");
    revalidatePath("/dashboard/exam/grade-ranges");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("change grade range status failed:", error);

    return {
      success: false as const,
      error: "change grade range status failed",
      details: {},
    };
  }
}

// server action — Fixed: remove the lying cast; let inference flow
export async function getClassSubjectWithExamType(data: examClassSearchType) {
  try {
    const [subjectsResult, markTypes] = await Promise.all([
      readMany({
        drizzleSchema: subjectAssignSchema,
        query: ({ db }) =>
          db.query.subjectAssignSchema.findMany({
            where: and(
              isNull(subjectAssignSchema.instituteId),
              eq(subjectAssignSchema.classId, data.classId),
            ),
            with: { subject: true },
            orderBy: (s, { asc }) => [asc(s.createdAt)],
          }),
      }),
      getDefaultMarkTypes(),
    ]);

    if (!subjectsResult.success) {
      return {
        success: false as const,
        error: "Failed to get subjects",
        details: {},
      };
    }

    // Fixed: subjectsResult.data is already the correct row shape
    const subjects = subjectsResult.data as ClassesSubjectsType[];
    const markTypesData = markTypes.success ? markTypes.data : [];

    const combined: ClassSubjectRowType[] = subjects.map((subject) => ({
      id: subject.id,
      classId: subject.classId,
      groupId: subject.groupId,
      subjectId: subject.subjectId,
      subject_type: subject.subject_type,
      isOptional: subject.isOptional,
      isReligion: subject.isReligion,
      status: subject.status,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      instituteId: subject.instituteId,
      subject: subject.subject
        ? {
            id: subject.subject.id,
            name: subject.subject.name,
            code: subject.subject.code,
            shortName: subject.subject.shortName,
          }
        : null,
      markTypes: markTypesData,
    }));

    return { success: true as const, data: combined };
  } catch (error) {
    return { success: false as const, error: String(error), details: {} };
  }
}
