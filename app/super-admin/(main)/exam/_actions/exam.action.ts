"use server";
import {
  examGradeRangeZod,
  examMarkTypesZod,
  InputExamGradeRangeType,
  InputExamMarkTypes,
  OutputExamGradeRangeType,
  OutputExamMarkTypes,
} from "../_schema/exam.zod";
import {
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
} from "@/src/drizzle-DB/schema";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { db } from "@/src/drizzle-DB";
import { eq, isNull } from "drizzle-orm";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";

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
