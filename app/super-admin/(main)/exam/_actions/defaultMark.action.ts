"use server";
import { requireSuperAdmin } from "@/src/server-actions/shared/require-super-admin.action";
import { isNull } from "drizzle-orm";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { and, eq, notInArray, sql } from "drizzle-orm";
import {
  defaultMarkZod,
  InputDefaultMarkType,
  OutputSubjectMarkTemplateRowType,
  subjectMarkTemplateRowZod,
} from "../_schema/markInput.zod";
import {
  subjectDbSchema,
  subjectMarkTemplates,
} from "@/src/drizzle-DB/schema";
import { parseWithZod } from "@/src/validation/validator.zod";

// get Default exam mark types
export async function getDefaultSubjectMark() {
  const auth = await requireSuperAdmin();
  if (!auth.success) return auth;

  try {
    const result = await db.query.subjectDbSchema.findMany({
      where: isNull(subjectDbSchema.instituteId),
      with: {
        markTemplates: {
          with: {
            markType: true,
          },
        },
      },
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error("action failed:", error);
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
      details: {},
    };
  }
}

// ==========post default subject mark ======================
export async function postDefultSubjectMark(data: InputDefaultMarkType) {
  const auth = await requireSuperAdmin();
  if (!auth.success) return auth;

  // 1. validate the whole payload (one subject + the enabled mark types)
  const parsed = parseWithZod(defaultMarkZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }

  const { subjectId, marks, status } = parsed.data;

  // 2. validate every row against the `subject_mark_templates` shape, so a bad
  //    row fails with field errors instead of a raw DB error later.
  const rows: OutputSubjectMarkTemplateRowType[] = [];
  for (const mark of marks) {
    const row = parseWithZod(subjectMarkTemplateRowZod, {
      ...mark,
      subjectId,
      status,
    });

    if (!row.success) {
      return {
        success: false as const,
        error: row.error,
        details: row.details,
      };
    }
    rows.push(row.data);
  }

  try {
    await db.transaction(async (tx) => {
      const markTypeIds = rows.map((row) => row.markTypeId);

      // 3. drop the mark types the subject is no longer using …
      await tx
        .delete(subjectMarkTemplates)
        .where(
          and(
            eq(subjectMarkTemplates.subjectId, subjectId),
            notInArray(subjectMarkTemplates.markTypeId, markTypeIds),
          ),
        );

      // … and insert / update the enabled ones in one statement.
      await tx
        .insert(subjectMarkTemplates)
        .values(rows)
        .onConflictDoUpdate({
          target: [
            subjectMarkTemplates.subjectId,
            subjectMarkTemplates.markTypeId,
          ],
          set: {
            fullMark: sql`excluded.full_mark`,
            passMark: sql`excluded.pass_mark`,
            status: sql`excluded.status`,
          },
        });
    });

    revalidatePath("/super-admin/exam/mark-config");
    revalidatePath("/dashboard/exam/mark-config");

    return { success: true as const, data: rows };
  } catch (error) {
    console.error("Assign Default Mark Type failed:", error);
    return {
      success: false as const,
      error: "Assign Default Mark Type failed",
      details: {},
    };
  }
}
