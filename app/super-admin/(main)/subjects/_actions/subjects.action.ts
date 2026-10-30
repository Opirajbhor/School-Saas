"use server";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import {
  ClassSubjectsType,
  combineSubjectsZod,
  inputSubAssignType,
  InputCombineSubjectsType,
  InputSubjectType,
  inputSubjectZod,
  OutputSubjectType,
  uncombineSubjectZod,
} from "@/src/validation/subjects.zod";
import {
  classesDrizzle,
  subjectAssignSchema,
  subjectDbSchema,
} from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { compareClassName } from "@/src/validation/classes.zod";

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

// ================= combine two papers =================
// Display only. The papers stay individual subjects in the list, in subject
// assignment and in mark entry; they are only shown together when marks are
// displayed.

// validate a pair without writing anything, shared by combine and its UI
type CombineCandidate = {
  id: string;
  name: string;
  instituteId: string | null;
  combineWith: string | null;
  combineLabel: string | null;
};

function validatePair(
  first: CombineCandidate | undefined,
  second: CombineCandidate | undefined,
) {
  if (!first || !second) {
    return "Select two subjects to combine";
  }
  if (first.id === second.id) {
    return "A subject cannot be combined with itself";
  }
  // a global record and an institute record must never end up in one pair
  if (first.instituteId !== second.instituteId) {
    return "Both subjects must belong to the same institute";
  }
  // one subject can only ever be in one pair, so a half-combined subject has
  // to be separated before it can join another
  if (first.combineWith || second.combineWith) {
    return "One of these subjects is already combined. Separate it first";
  }
  if (first.combineLabel || second.combineLabel) {
    return "One of these subjects still carries a combine label. Separate it first";
  }
  return null;
}

// two papers become a pair: the second points at the first (the anchor) and
// both carry the label the pair is shown under
export async function combineSubjects(data: InputCombineSubjectsType) {
  const parsed = combineSubjectsZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid combine request",
      details: {},
    };
  }
  const { firstSubjectId, secondSubjectId, label } = parsed.data;

  // super-admin manages the global defaults, and the pair must stay in one scope
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { instituteId } = ctx;

  try {
    const result = await db.transaction(async (tx) => {
      const rows = await tx
        .select({
          id: subjectDbSchema.id,
          name: subjectDbSchema.name,
          instituteId: subjectDbSchema.instituteId,
          combineWith: subjectDbSchema.combineWith,
          combineLabel: subjectDbSchema.combineLabel,
        })
        .from(subjectDbSchema)
        .where(
          and(
            inArray(subjectDbSchema.id, [firstSubjectId, secondSubjectId]),
            or(
              isNull(subjectDbSchema.instituteId),
              eq(subjectDbSchema.instituteId, instituteId),
            ),
          ),
        );

      const first = rows.find((row) => row.id === firstSubjectId);
      const second = rows.find((row) => row.id === secondSubjectId);

      const invalid = validatePair(first, second);
      if (invalid) throw new Error(invalid);

      await tx
        .update(subjectDbSchema)
        .set({ combineWith: firstSubjectId, combineLabel: label })
        .where(eq(subjectDbSchema.id, secondSubjectId));

      await tx
        .update(subjectDbSchema)
        .set({ combineWith: null, combineLabel: label })
        .where(eq(subjectDbSchema.id, firstSubjectId));

      return rows;
    });

    revalidatePath("/super-admin/subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("combineSubjects failed:", error);
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to combine subjects",
      details: {},
    };
  }
}

// clears the pair. Safe when called on either paper.
export async function uncombineSubject(data: { subjectId: string }) {
  const parsed = uncombineSubjectZod.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid subject id",
      details: {},
    };
  }
  const { subjectId } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx
        .select({
          id: subjectDbSchema.id,
          combineWith: subjectDbSchema.combineWith,
          combineLabel: subjectDbSchema.combineLabel,
        })
        .from(subjectDbSchema)
        .where(eq(subjectDbSchema.id, subjectId))
        .limit(1);

      const subject = current[0];
      if (!subject) throw new Error("Subject not found");

      // the anchor sits at the other end of the pointer
      const anchorId = subject.combineWith ?? subject.id;

      const affected = await tx
        .select({ id: subjectDbSchema.id })
        .from(subjectDbSchema)
        .where(
          or(
            eq(subjectDbSchema.id, anchorId),
            eq(subjectDbSchema.combineWith, anchorId),
          ),
        );

      await tx
        .update(subjectDbSchema)
        .set({ combineWith: null, combineLabel: null })
        .where(
          inArray(
            subjectDbSchema.id,
            affected.map((row) => row.id),
          ),
        );

      return affected;
    });

    revalidatePath("/super-admin/subjects");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("uncombineSubject failed:", error);
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to separate subjects",
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
        }),
    });
    return {
      success: true as const,
      data: (result.data as ClassSubjectsType[]).sort(compareClassName),
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
        status: row.status,
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

  // Assignment is a platform-wide default when a superadmin runs it from
  // /super-admin (matching getDefaultAssignSubjects, which filters
  // instituteId IS NULL), and an institute-scoped row on the tenant dashboard.
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const instituteId = ctx.role === "superadmin" ? null : ctx.instituteId;

  try {
    const result = await db.transaction(async (tx) => {
      return await Promise.all(
        subjectIds.map(async (subjectId) => {
          const payload = {
            instituteId,
            classId: rest.classId,
            groupId: rest.groupId,
            // the column is subject_type; writing subjectType here silently
            // dropped the choice and left every row on the COMPULSORY default
            subject_type: rest.subject_type,
            isOptional: rest.isOptional,
            isReligion: rest.isReligion,
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

    revalidatePath("/dashboard/subjects/assignment");
    revalidatePath("/super-admin/subjects/assignment");
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
