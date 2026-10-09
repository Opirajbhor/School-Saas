"use server";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { eq, isNull } from "drizzle-orm";
import {
  ClassSubjectsType,
  inputSubAssignType,
  InputSubjectType,
  inputSubjectZod,
  OutputSubjectType,
} from "@/src/validation/subjects.zod";
import {
  classesDrizzle,
  subjectAssignSchema,
  subjectDbSchema,
} from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";

// get Default Subjects
export async function getDefaultSubjects() {
  try {
    const result = await readMany({
      drizzleSchema: subjectDbSchema,
      query: ({ db }) =>
        db.query.subjectDbSchema.findMany({
          where: isNull(subjectDbSchema.instituteId),
          orderBy: (subjectDbSchema, { asc }) => [
            asc(subjectDbSchema.createdAt),
          ],
        }),
    });
    return {
      success: true as const,
      data: result.data as OutputSubjectType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// create subjects
export async function createAcademicsubjects(data: InputSubjectType) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: subjectDbSchema,
        zodSchema: inputSubjectZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admin/academic-subjects");
    revalidatePath("/dashboard/academic-subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicsubjects failed:", error);
    return {
      success: false as const,
      error: "Failed to create subjects",
      details: {},
    };
  }
}

// change status of subjects
export async function changeStatussubjects(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.subjectDbSchema.findFirst({
        where: eq(subjectDbSchema.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(subjectDbSchema)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(subjectDbSchema.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-subjects");
    revalidatePath("/dashboard/academic-subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicsubjects failed:", error);

    return {
      success: false as const,
      error: "Failed to create subjects",
      details: {},
    };
  }
}

// delete subjects
export async function deletesubjects(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      return await tx
        .delete(subjectDbSchema)
        .where(eq(subjectDbSchema.id, id))
        .returning();
    });
    revalidatePath("/super-admin/academic-subjects");
    revalidatePath("/dashboard/academic-subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicsubjects failed:", error);

    return {
      success: false as const,
      error: "Failed to create subjects",
      details: {},
    };
  }
}

// ================= subject Assignment ==================

// get Default class subjects
export async function getDefaultClassSubjects() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db }) =>
        db.query.classesDrizzle.findMany({
          where: isNull(classesDrizzle.instituteId),
          with: {
            groupClasses: true,
          },
          orderBy: (classesDrizzle, { asc }) => [asc(classesDrizzle.createdAt)],
        }),
    });
    return {
      success: true as const,
      data: result.data as ClassSubjectsType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// get Default Assign Subjects
export async function getDefaultAssignSubjects() {
  try {
    const result = await db.query.subjectAssignSchema.findMany({
      where: isNull(subjectAssignSchema.instituteId),
      with: {
        class: true,
        subject: true,
        group: true,
      },
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    // Group by class + group (composite key)
    const subjects = result
      .filter((row) => row.class && row.subject)
      .map((row) => ({
        id: `${row.class!.id}-${row.subject!.id}`,
        className: row.class!.name,
        groupName: row.group?.name ?? "",
        subjectName: row.subject!.name,
        subjectType: row.subject_type,
        isOptional: row.isOptional,
        isReligion: row.isReligion,
      }));

    return { success: true as const, data: subjects };
  } catch (error) {
    return { success: false as const, error: String(error), details: {} };
  }
}

// ------------subject assignment *** custom server action-----------
export async function subjectAssignment(data: inputSubAssignType) {
  const { subjectIds, ...rest } = data;

  // ----Validate that at least one subject was selected-------.
  if (!subjectIds.length) {
    return {
      success: false as const,
      error: "Please select at least one subject",
      details: {},
    };
  }
  try {
    const result = await db.transaction(async (tx) => {
      return Promise.all(
        subjectIds.map(async (subjectId) => {
          const payload = {
            classId: rest.classId,
            groupId: rest.groupId,
            subjectType: rest.subject_type,
            subjectId,
            status: "ACTIVE" as const,
          };
          const [data] = await tx
            .insert(subjectAssignSchema)
            .values(payload)
            .returning();
          return data;
        }),
      );
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (err) {
    console.error("Subject assignment failed:", err);
    return {
      success: false as const,
      error: "Failed to assign subjects",
      details: {},
    };
  }
}
