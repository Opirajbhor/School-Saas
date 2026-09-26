"use server";
import { createRecord } from "@/src/server-actions/crud-funtions/server-create-crud";
import {
  examGradeRangeZod,
  examMarkTypesZod,
  examZod,
  InputExamGradeRangeType,
  InputExamMarkTypes,
  InputExamType,
} from "../_schema/exam.zod";
import {
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  exams,
} from "@/src/drizzle-DB/schema";
import { toggleStatus } from "@/src/server-actions/crud-funtions/server-status.action";
import { revalidatePath } from "next/cache";

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
