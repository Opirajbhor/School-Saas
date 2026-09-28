"use server";
import { createRecord } from "@/src/server-actions/crud-funtions/server-create-crud";
import {
  examAssignZod,
  examGradeRangeZod,
  examMarkTypesZod,
  examZod,
  InputExamAssignType,
  InputExamGradeRangeType,
  InputExamMarkTypes,
  InputExamType,
} from "../_schema/exam.zod";
import {
  examClasses,
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  exams,
} from "@/src/drizzle-DB/schema";
import { toggleStatus } from "@/src/server-actions/crud-funtions/server-status.action";
import { revalidatePath } from "next/cache";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { db } from "@/src/drizzle-DB";
import { and, eq, inArray } from "drizzle-orm";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";

//===================  exam ===============
// post exam
export async function postExam(data: InputExamType) {
  const result = await createRecord(
    {
      zodSchema: examZod,
      drizzleSchema: exams,
      additionFields: { status: "ACTIVE" },
      entity: "EXAM",
    },
    data,
  );
  if (result.success) {
    revalidatePath("/dashboard/exam/create");
  }
  return result;
}
// toggle status
export async function ToggleExamStatus(id: string) {
  const result = await toggleStatus(
    {
      drizzleSchema: exams,
      entity: "EXAM",
    },
    id,
  );
  if (result.success) {
    revalidatePath("/dashboard/exam/create");
  }
  return result;
}

// ============ exam assign to class =============
// assign to class
export async function assignExamClasses(data: InputExamAssignType) {
  const ctx = await getUserContext();

  if (!ctx) {
    return {
      success: false as const,
      error: "No User session foundF",
      details: {},
    };
  }
  const { userId, instituteId } = ctx;

  const validation = examAssignZod.safeParse(data);
  if (!validation.success) {
    return {
      success: false as const,
      error: "Invalid data",
      details: validation.error.flatten().fieldErrors,
    };
  }
  const { examId, classId } = validation.data;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Deactivate all existing classes in the group
      await tx
        .update(examClasses)
        .set({ status: "INACTIVE" })
        .where(
          and(
            eq(examClasses.instituteId, instituteId),
            eq(examClasses.examId, examId),
          ),
        );

      // Get existing assignments to determine which are new
      const existingAssignments = await tx.query.examClasses.findMany({
        where: and(
          eq(examClasses.examId, examId),
          eq(examClasses.instituteId, instituteId),
        ),
      });

      const existingClassIdSet = new Set(
        existingAssignments.map((item) => item.classId),
      );

      // Reactivate existing classes
      if (classId.length > 0) {
        await tx
          .update(examClasses)
          .set({ status: "ACTIVE" })
          .where(
            and(
              inArray(examClasses.classId, classId),
              eq(examClasses.examId, examId),
              eq(examClasses.instituteId, instituteId),
            ),
          );
      }

      // Create new class assignments
      const newClassIds = classId.filter((id) => !existingClassIdSet.has(id));

      if (newClassIds.length > 0) {
        await tx.insert(examClasses).values(
          newClassIds.map((item) => ({
            examId,
            classId: item,
            instituteId,
            status: "ACTIVE" as const,
          })),
        );
      }

      // =========audit logs==========
      for (const item of newClassIds) {
        await createAuditLog(tx, {
          instituteId,
          userId,
          action: "UPDATED",
          entity: "ASSIGNED_CLASS_TO_EXAM",
          entityId: item,
          metadata: { examId },
        });
      }
      // Return all active items
      return await tx.query.examClasses.findMany({
        where: and(
          eq(examClasses.examId, examId),
          eq(examClasses.instituteId, instituteId),
          eq(examClasses.status, "ACTIVE"),
        ),
      });
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to update Exam assignment",
      details: {},
    };
  }
}

//=================  exam mark types ==============
//======== post exam mark types ========
export async function postMarkTypes(data: InputExamMarkTypes) {
  const result = await createRecord(
    {
      zodSchema: examMarkTypesZod,
      drizzleSchema: examMarkTypesDrizzle,
      additionFields: { status: "ACTIVE" },
      entity: "EXAM_MARK_TYPES",
    },
    data,
  );
  if (result.success) {
    revalidatePath("/dashboard/exam/mark-types");
  }
  return result;
}

//======== toogleStatus exam mark types ========
export async function ToggleExamtypeStatus(id: string) {
  const result = await toggleStatus(
    {
      drizzleSchema: examMarkTypesDrizzle,
      entity: "EXAM_MARK_TYPES",
    },
    id,
  );
  if (result.success) {
    revalidatePath("/dashboard/exam/mark-types");
  }
  return result;
}

//========================= post exam Grade Ranges ======================
//======== post exam Grade Ranges ========
export async function postGradeRange(data: InputExamGradeRangeType) {
  const result = await createRecord(
    {
      zodSchema: examGradeRangeZod,
      drizzleSchema: examGradeRangeDrizzle,
      additionFields: { status: "ACTIVE" },
      entity: "EXAM_GRADE_RANGE",
    },
    data,
  );
  if (result.success) {
    revalidatePath("/dashboard/exam/grade-ranges");
  }
  return result;
}

//======== toogleStatus exam grade ranges ========
export async function ToggleGradeRangeStatus(id: string) {
  const result = await toggleStatus(
    {
      drizzleSchema: examGradeRangeDrizzle,
      entity: "EXAM_GRADE_RANGE",
    },
    id,
  );
  if (result.success) {
    revalidatePath("/dashboard/exam/grade-ranges");
  }
  return result;
}
