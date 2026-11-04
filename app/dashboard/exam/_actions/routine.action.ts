"use server";

/**
 * Exam routine — the date/time table a school publishes before an exam.
 *
 * A slot is one sitting: a subject, on a date, from a start to an end time, for
 * one class. `sectionId` narrows it to a single section, which is how practical
 * exams are usually sat. The routine is stored per institute (never shared with
 * other tenants) and is read back as a matrix: dates down the side, classes
 * across the top.
 */

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/src/drizzle-DB";
import {
  classesDrizzle,
  examClasses,
  examRoutineNotices,
  examRoutines,
  exams,
  sectionDrizzle,
  subjectAssignSchema,
  subjectDbSchema,
} from "@/src/drizzle-DB/schema";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import {
  copyDayZod,
  copySlotZod,
  InputMultiSlotType,
  InputRoutineNoticeType,
  multiSlotZod,
  routineNoticeZod,
  examRoutineIdZod,
  examRoutineQueryZod,
  examRoutineSlotZod,
  InputCopyDayType,
  InputCopySlotType,
  InputExamRoutineSlotType,
} from "../_schema/routine.zod";

export type RoutineSlot = {
  id: string;
  classId: string;
  className: string;
  sectionId: string | null;
  sectionName: string | null;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  kind: "THEORY" | "PRACTICAL";
  examDate: string;
  startsAt: string;
  endsAt: string;
  note: string | null;
};

export type RoutineClass = { id: string; name: string };
export type RoutineSubject = {
  id: string;
  classId: string;
  name: string;
  shortName: string;
};
export type RoutineSection = {
  id: string;
  classId: string;
  name: string;
};

export type ExamRoutinePayload = {
  exam: { id: string; name: string };
  /** instructions printed under the routine, empty when none are set */
  notice: string;
  classes: RoutineClass[];
  subjects: RoutineSubject[];
  sections: RoutineSection[];
  rows: RoutineSlot[];
};

// writing a routine is an institute-admin job; reading is too, because the
// routine carries dates the school has not announced yet
async function requireRoutineAccess() {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  if (ctx.role !== "admin" && ctx.role !== "superadmin") {
    return { success: false as const, error: "Not authorized", details: {} };
  }
  return { success: true as const, data: ctx };
}

const FAILED = {
  success: false as const,
  error: "Something went wrong. Please try again.",
  details: {},
} as const;

// "10:30:00" -> "10:30" for the dialog and the printed sheet
const toHhMm = (value: string) => value.slice(0, 5);

/** Exams this institute may schedule: its own, plus the platform defaults. */
export async function getRoutineExams() {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  try {
    const rows = await db
      .select({ id: exams.id, name: exams.name, markWorkflow: exams.markWorkflow })
      .from(exams)
      .where(
        and(
          eq(exams.status, "ACTIVE"),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
      )
      .orderBy(asc(exams.name));

    return { success: true as const, data: rows };
  } catch (error) {
    console.error("getRoutineExams failed:", error);
    return FAILED;
  }
}

/** Everything the board needs for one exam, in one round trip per query. */
export async function getExamRoutine(data: { examId: string }) {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = parseWithZod(examRoutineQueryZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId } = parsed.data;

  try {
    const [examRow] = await db
      .select({ id: exams.id, name: exams.name })
      .from(exams)
      .where(
        and(
          eq(exams.id, examId),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
      )
      .limit(1);

    if (!examRow) {
      return { success: false as const, error: "Exam not found", details: {} };
    }

    // the columns of the matrix: the classes this exam was assigned to, plus
    // any class that already has a slot (so nothing silently disappears)
    const [
      assignedClasses,
      classRows,
      subjectRows,
      sectionRows,
      slotRows,
      noticeRows,
    ] = await Promise.all([
        db
          .select({ id: classesDrizzle.id, name: classesDrizzle.name })
          .from(examClasses)
          .innerJoin(classesDrizzle, eq(classesDrizzle.id, examClasses.classId))
          .where(
            and(
              eq(examClasses.examId, examId),
              eq(examClasses.status, "ACTIVE"),
              or(
                isNull(examClasses.instituteId),
                eq(examClasses.instituteId, instituteId),
              ),
            ),
          )
          .orderBy(asc(classesDrizzle.name)),

        db
          .select({ id: classesDrizzle.id, name: classesDrizzle.name })
          .from(classesDrizzle)
          .where(
            and(
              eq(classesDrizzle.status, "ACTIVE"),
              or(
                isNull(classesDrizzle.instituteId),
                eq(classesDrizzle.instituteId, instituteId),
              ),
            ),
          )
          .orderBy(asc(classesDrizzle.name)),

        db
          .select({
            id: subjectDbSchema.id,
            classId: subjectAssignSchema.classId,
            name: subjectDbSchema.name,
            shortName: subjectDbSchema.shortName,
          })
          .from(subjectAssignSchema)
          .innerJoin(
            subjectDbSchema,
            eq(subjectDbSchema.id, subjectAssignSchema.subjectId),
          )
          .where(
            and(
              eq(subjectAssignSchema.status, "ACTIVE"),
              eq(subjectDbSchema.status, "ACTIVE"),
              or(
                isNull(subjectAssignSchema.instituteId),
                eq(subjectAssignSchema.instituteId, instituteId),
              ),
            ),
          )
          .orderBy(asc(subjectDbSchema.name)),

        db
          .select({
            id: sectionDrizzle.id,
            classId: sectionDrizzle.classId,
            name: sectionDrizzle.name,
          })
          .from(sectionDrizzle)
          .where(
            and(
              eq(sectionDrizzle.status, "ACTIVE"),
              eq(sectionDrizzle.instituteId, instituteId),
            ),
          )
          .orderBy(asc(sectionDrizzle.name)),

        db
          .select({
            id: examRoutines.id,
            classId: examRoutines.classId,
            className: classesDrizzle.name,
            sectionId: examRoutines.sectionId,
            sectionName: sectionDrizzle.name,
            subjectId: examRoutines.subjectId,
            subjectName: subjectDbSchema.name,
            subjectShortName: subjectDbSchema.shortName,
            kind: examRoutines.kind,
            examDate: examRoutines.examDate,
            startsAt: examRoutines.startsAt,
            endsAt: examRoutines.endsAt,
            note: examRoutines.note,
          })
          .from(examRoutines)
          .innerJoin(classesDrizzle, eq(classesDrizzle.id, examRoutines.classId))
          .innerJoin(
            subjectDbSchema,
            eq(subjectDbSchema.id, examRoutines.subjectId),
          )
          .leftJoin(
            sectionDrizzle,
            eq(sectionDrizzle.id, examRoutines.sectionId),
          )
          .where(
            and(
              eq(examRoutines.examId, examId),
              eq(examRoutines.instituteId, instituteId),
            ),
          )
          .orderBy(asc(examRoutines.examDate), asc(examRoutines.startsAt)),

        db
          .select({ notice: examRoutineNotices.notice })
          .from(examRoutineNotices)
          .where(
            and(
              eq(examRoutineNotices.examId, examId),
              eq(examRoutineNotices.instituteId, instituteId),
            ),
          )
          .limit(1),
      ]);

    // Columns are the classes the exam was assigned to, plus any class that
    // already has a slot. Before the first assignment (or the first paper) the
    // matrix would otherwise be empty, so fall back to every active class.
    const classes = new Map<string, RoutineClass>();
    for (const row of assignedClasses) classes.set(row.id, row);
    for (const row of slotRows) {
      if (!classes.has(row.classId)) {
        classes.set(row.classId, { id: row.classId, name: row.className });
      }
    }
    if (classes.size === 0) {
      for (const row of classRows) classes.set(row.id, row);
    }

    return {
      success: true as const,
      data: {
        exam: examRow,
        notice: noticeRows[0]?.notice ?? "",
        classes: [...classes.values()],
        subjects: subjectRows,
        sections: sectionRows,
        rows: slotRows.map((row) => ({
          ...row,
          startsAt: toHhMm(row.startsAt),
          endsAt: toHhMm(row.endsAt),
        })),
      } satisfies ExamRoutinePayload,
    };
  } catch (error) {
    console.error("getExamRoutine failed:", error);
    return FAILED;
  }
}

/** Create or move one sitting. */
export async function saveRoutineSlot(data: InputExamRoutineSlotType) {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = parseWithZod(examRoutineSlotZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const slot = parsed.data;

  try {
    // the exam and the class both have to be reachable from this institute; a
    // raw uuid from the browser is not proof of ownership
    const [[examRow], [classRow]] = await Promise.all([
      db
        .select({ id: exams.id })
        .from(exams)
        .where(
          and(
            eq(exams.id, slot.examId),
            or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
          ),
        )
        .limit(1),
      db
        .select({ id: classesDrizzle.id })
        .from(classesDrizzle)
        .where(
          and(
            eq(classesDrizzle.id, slot.classId),
            or(
              isNull(classesDrizzle.instituteId),
              eq(classesDrizzle.instituteId, instituteId),
            ),
          ),
        )
        .limit(1),
    ]);

    if (!examRow) {
      return { success: false as const, error: "Exam not found", details: {} };
    }
    if (!classRow) {
      return { success: false as const, error: "Class not found", details: {} };
    }

    // the subject has to be assigned to that class, otherwise the routine would
    // schedule a paper nobody studies
    const [assignment] = await db
      .select({ id: subjectAssignSchema.id })
      .from(subjectAssignSchema)
      .where(
        and(
          eq(subjectAssignSchema.classId, slot.classId),
          eq(subjectAssignSchema.subjectId, slot.subjectId),
          eq(subjectAssignSchema.status, "ACTIVE"),
          or(
            isNull(subjectAssignSchema.instituteId),
            eq(subjectAssignSchema.instituteId, instituteId),
          ),
        ),
      )
      .limit(1);

    if (!assignment) {
      return {
        success: false as const,
        error: "That subject is not assigned to this class",
        details: {},
      };
    }

    const values = {
      instituteId,
      examId: slot.examId,
      classId: slot.classId,
      sectionId: slot.sectionId ?? null,
      subjectId: slot.subjectId,
      kind: slot.kind,
      examDate: slot.examDate,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      note: slot.note?.length ? slot.note : null,
      updatedAt: new Date(),
    };

    if (slot.id) {
      const [updated] = await db
        .update(examRoutines)
        .set(values)
        .where(
          and(
            eq(examRoutines.id, slot.id),
            eq(examRoutines.instituteId, instituteId),
          ),
        )
        .returning({ id: examRoutines.id });

      if (!updated) {
        return { success: false as const, error: "Slot not found", details: {} };
      }
    } else {
      // one paper per class per date: catching it here gives a readable message
      // instead of a unique-violation trace
      const [clash] = await db
        .select({ id: examRoutines.id })
        .from(examRoutines)
        .where(
          and(
            eq(examRoutines.examId, slot.examId),
            eq(examRoutines.classId, slot.classId),
            eq(examRoutines.subjectId, slot.subjectId),
            eq(examRoutines.kind, slot.kind),
            eq(examRoutines.examDate, slot.examDate),
          ),
        )
        .limit(1);

      if (clash) {
        return {
          success: false as const,
          error: "That paper is already scheduled for this class on that date",
          details: {},
        };
      }

      await db.insert(examRoutines).values(values);
    }

    revalidatePath("/dashboard/exam/routine");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("saveRoutineSlot failed:", error);
    return FAILED;
  }
}

/** Remove one sitting. */
export async function deleteRoutineSlot(id: string) {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = examRoutineIdZod.safeParse(id);
  if (!parsed.success) {
    return { success: false as const, error: "Slot not found", details: {} };
  }

  try {
    const [deleted] = await db
      .delete(examRoutines)
      .where(
        and(
          eq(examRoutines.id, parsed.data),
          eq(examRoutines.instituteId, instituteId),
        ),
      )
      .returning({ id: examRoutines.id });

    if (!deleted) {
      return { success: false as const, error: "Slot not found", details: {} };
    }

    revalidatePath("/dashboard/exam/routine");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("deleteRoutineSlot failed:", error);
    return FAILED;
  }
}

/**
 * Copy one sitting to other classes on the same day.
 *
 * The sample routine has every class sitting the same paper at the same hour on
 * a given date, so retyping it per class was the slow part. Classes that do not
 * study the subject are skipped instead of failing the whole copy.
 */
export async function copyRoutineSlot(data: InputCopySlotType) {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = parseWithZod(copySlotZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { slotId, classIds } = parsed.data;

  try {
    const [source] = await db
      .select()
      .from(examRoutines)
      .where(
        and(
          eq(examRoutines.id, slotId),
          eq(examRoutines.instituteId, instituteId),
        ),
      )
      .limit(1);

    if (!source) {
      return { success: false as const, error: "Sitting not found", details: {} };
    }

    // classes must belong to this institute (or be global defaults)
    const allowed = await db
      .select({ id: classesDrizzle.id })
      .from(classesDrizzle)
      .where(
        and(
          or(
            isNull(classesDrizzle.instituteId),
            eq(classesDrizzle.instituteId, instituteId),
          ),
          inArray(classesDrizzle.id, classIds),
        ),
      );
    const allowedIds = new Set(allowed.map((row) => row.id));

    if (allowedIds.size === 0) {
      return {
        success: false as const,
        error: "None of the selected classes belong to this institute",
        details: {},
      };
    }

    // and each class must actually study the subject
    const assigned = await db
      .select({ classId: subjectAssignSchema.classId })
      .from(subjectAssignSchema)
      .where(
        and(
          eq(subjectAssignSchema.subjectId, source.subjectId),
          eq(subjectAssignSchema.status, "ACTIVE"),
          or(
            isNull(subjectAssignSchema.instituteId),
            eq(subjectAssignSchema.instituteId, instituteId),
          ),
          inArray(subjectAssignSchema.classId, [...allowedIds]),
        ),
      );
    const studyIds = new Set(assigned.map((row) => row.classId));

    const targets = [...allowedIds].filter(
      (classId) => classId !== source.classId && studyIds.has(classId),
    );

    if (targets.length === 0) {
      return {
        success: false as const,
        error:
          "None of the selected classes study this subject, or they already have it",
        details: {},
      };
    }

    const inserted = await db
      .insert(examRoutines)
      .values(
        targets.map((classId) => ({
          instituteId,
          examId: source.examId,
          classId,
          sectionId: null,
          subjectId: source.subjectId,
          kind: source.kind,
          examDate: source.examDate,
          startsAt: source.startsAt,
          endsAt: source.endsAt,
          note: source.note,
        })),
      )
      // a class that already had this paper that day keeps its own time
      .onConflictDoNothing()
      .returning({ id: examRoutines.id });

    revalidatePath("/dashboard/exam/routine");
    return {
      success: true as const,
      data: { copied: inserted.length, skipped: targets.length - inserted.length },
    };
  } catch (error) {
    console.error("copyRoutineSlot failed:", error);
    return FAILED;
  }
}

/** Copy every sitting of one date onto another date (a week later, a slipped day). */
export async function copyRoutineDay(data: InputCopyDayType) {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = parseWithZod(copyDayZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, fromDate, toDate } = parsed.data;

  if (fromDate === toDate) {
    return {
      success: false as const,
      error: "Pick a different date to copy to",
      details: {},
    };
  }

  try {
    const rows = await db
      .select()
      .from(examRoutines)
      .where(
        and(
          eq(examRoutines.examId, examId),
          eq(examRoutines.instituteId, instituteId),
          eq(examRoutines.examDate, fromDate),
        ),
      );

    if (rows.length === 0) {
      return {
        success: false as const,
        error: "That day has no sittings to copy",
        details: {},
      };
    }

    const inserted = await db
      .insert(examRoutines)
      .values(
        rows.map((row) => ({
          instituteId,
          examId: row.examId,
          classId: row.classId,
          sectionId: row.sectionId,
          subjectId: row.subjectId,
          kind: row.kind,
          examDate: toDate,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
          note: row.note,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: examRoutines.id });

    revalidatePath("/dashboard/exam/routine");
    return {
      success: true as const,
      data: { copied: inserted.length, skipped: rows.length - inserted.length },
    };
  } catch (error) {
    console.error("copyRoutineDay failed:", error);
    return FAILED;
  }
}

/**
 * Add one paper to several classes at once — the usual case, since a school
 * sits the same subject across classes on the same day.
 */
export async function saveRoutineSlots(data: InputMultiSlotType) {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = parseWithZod(multiSlotZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const slot = parsed.data;

  try {
    const [examRow] = await db
      .select({ id: exams.id })
      .from(exams)
      .where(
        and(
          eq(exams.id, slot.examId),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
      )
      .limit(1);

    if (!examRow) {
      return { success: false as const, error: "Exam not found", details: {} };
    }

    const classes = await db
      .select({ id: classesDrizzle.id })
      .from(classesDrizzle)
      .where(
        and(
          or(
            isNull(classesDrizzle.instituteId),
            eq(classesDrizzle.instituteId, instituteId),
          ),
          inArray(classesDrizzle.id, slot.classIds),
        ),
      );
    const allowedIds = new Set(classes.map((row) => row.id));

    const assignments = await db
      .select({ classId: subjectAssignSchema.classId })
      .from(subjectAssignSchema)
      .where(
        and(
          eq(subjectAssignSchema.subjectId, slot.subjectId),
          eq(subjectAssignSchema.status, "ACTIVE"),
          or(
            isNull(subjectAssignSchema.instituteId),
            eq(subjectAssignSchema.instituteId, instituteId),
          ),
          inArray(subjectAssignSchema.classId, [...allowedIds]),
        ),
      );
    const studyIds = new Set(assignments.map((row) => row.classId));

    const targets = [...allowedIds].filter((classId) => studyIds.has(classId));
    if (targets.length === 0) {
      return {
        success: false as const,
        error: "None of the selected classes study this subject",
        details: {},
      };
    }

    const inserted = await db
      .insert(examRoutines)
      .values(
        targets.map((classId) => ({
          instituteId,
          examId: slot.examId,
          classId,
          sectionId: targets.length === 1 ? (slot.sectionId ?? null) : null,
          subjectId: slot.subjectId,
          kind: slot.kind,
          examDate: slot.examDate,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          note: slot.note?.length ? slot.note : null,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: examRoutines.id });

    revalidatePath("/dashboard/exam/routine");
    return {
      success: true as const,
      data: { created: inserted.length, skipped: targets.length - inserted.length },
    };
  } catch (error) {
    console.error("saveRoutineSlots failed:", error);
    return FAILED;
  }
}

/** Save the instructions printed at the bottom of the routine. */
export async function saveRoutineNotice(data: InputRoutineNoticeType) {
  const auth = await requireRoutineAccess();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = parseWithZod(routineNoticeZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId } = parsed.data;
  const notice = parsed.data.notice.trim();

  try {
    const [examRow] = await db
      .select({ id: exams.id })
      .from(exams)
      .where(
        and(
          eq(exams.id, examId),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
      )
      .limit(1);

    if (!examRow) {
      return { success: false as const, error: "Exam not found", details: {} };
    }

    await db
      .insert(examRoutineNotices)
      .values({ instituteId, examId, notice })
      .onConflictDoUpdate({
        target: [examRoutineNotices.instituteId, examRoutineNotices.examId],
        set: { notice, updatedAt: new Date() },
      });

    revalidatePath("/dashboard/exam/routine");
    return { success: true as const, data: { notice } };
  } catch (error) {
    console.error("saveRoutineNotice failed:", error);
    return FAILED;
  }
}
