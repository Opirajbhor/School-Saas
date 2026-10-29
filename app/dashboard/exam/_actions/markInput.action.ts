"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import { db } from "@/src/drizzle-DB";
import {
  classesDrizzle,
  enrollments,
  examClasses,
  examMarkCorrections,
  examMarkEditRequests,
  examMarkTypesDrizzle,
  examMarks,
  exams,
  sectionClassTeachers,
  sectionDrizzle,
  sectionSubjectTeachers,
  student,
  subjectAssignSchema,
  subjectDbSchema,
  subjectMarkTemplates,
  teachers,
} from "@/src/drizzle-DB/schema";
import {
  examMarkColumnsZod,
  InputExamMarkColumnsType,
  InputSaveMarkInputType,
  MarkEntryStatus,
  MarkWorkflow,
  saveMarkInputZod,
  OutputMarkEntrySheetType,
} from "../_schema/exam.zod";

// selected row shapes returned by the joins below
type ExamRow = { id: string; name: string };
type OptionRow = { id: string; name: string };
type StudentRow = {
  studentId: string;
  roll: string;
  englishName: string;
  banglaName: string | null;
};
type TeacherRow = { id: string; nameEnglish: string };
type MarkTypeRow = {
  id: string;
  name: string;
  fullMark: number;
  passMark: number;
};
// per-student saved state, as read back from exam_marks
type SavedMarkState = {
  status: MarkEntryStatus;
  marks: Map<string, { mark: number; absent: boolean }>;
};

// ================== selectors ==================

// exams assigned to a class of the current institute
// rows with a null instituteId are global defaults
const instituteScope = (instituteId: string) =>
  or(isNull(examClasses.instituteId), eq(examClasses.instituteId, instituteId));

export async function getExamOptions() {
  return readMany({
    drizzleSchema: exams,
    query: ({ db, instituteId }) =>
      db
        .selectDistinct({ id: exams.id, name: exams.name })
        .from(exams)
        .innerJoin(
          examClasses,
          and(
            eq(examClasses.examId, exams.id),
            instituteScope(instituteId),
            eq(examClasses.status, "ACTIVE"),
          ),
        )
        .where(
          and(
            eq(exams.status, "ACTIVE"),
            or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
          ),
        )
        .orderBy(asc(exams.name)),
  });
}

// classes the exam is assigned to
export async function getExamClassOptions(examId: string) {
  return readMany({
    drizzleSchema: examClasses,
    query: ({ db, instituteId }) =>
      db
        .select({ id: classesDrizzle.id, name: classesDrizzle.name })
        .from(examClasses)
        .innerJoin(classesDrizzle, eq(classesDrizzle.id, examClasses.classId))
        .where(
          and(
            eq(examClasses.examId, examId),
            instituteScope(instituteId),
            eq(examClasses.status, "ACTIVE"),
            eq(classesDrizzle.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(classesDrizzle.name)),
  });
}

// sections + subjects of a class, to fill the step-2 dropdowns
export async function getExamClassFilters(classId: string) {
  const sections = await readMany({
    drizzleSchema: sectionDrizzle,
    query: ({ db, instituteId }) =>
      db
        .select({ id: sectionDrizzle.id, name: sectionDrizzle.name })
        .from(sectionDrizzle)
        .where(
          and(
            eq(sectionDrizzle.classId, classId),
            eq(sectionDrizzle.instituteId, instituteId),
            eq(sectionDrizzle.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(sectionDrizzle.name)),
  });

  const subjects = await readMany({
    drizzleSchema: subjectAssignSchema,
    query: ({ db, instituteId }) =>
      db
        .select({ id: subjectDbSchema.id, name: subjectDbSchema.name })
        .from(subjectAssignSchema)
        .innerJoin(
          subjectDbSchema,
          eq(subjectDbSchema.id, subjectAssignSchema.subjectId),
        )
        .where(
          and(
            eq(subjectAssignSchema.classId, classId),
            eq(subjectAssignSchema.status, "ACTIVE"),
            or(
              isNull(subjectAssignSchema.instituteId),
              eq(subjectAssignSchema.instituteId, instituteId),
            ),
            or(
              isNull(subjectDbSchema.instituteId),
              eq(subjectDbSchema.instituteId, instituteId),
            ),
          ),
        )
        .orderBy(asc(subjectDbSchema.name)),
  });

  if (!sections.success || !subjects.success) {
    return {
      success: false as const,
      error: "Failed to load sections and subjects",
      details: {},
    };
  }

  return {
    success: true as const,
    data: {
      sections: sections.data as OptionRow[],
      subjects: subjects.data as OptionRow[],
    },
  };
}

// ================== mark entry sheet ==================

// everything the mark sheet needs for one exam/class/section/subject
export async function getExamMarkSheet(data: InputExamMarkColumnsType) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }

  const parsed = parseWithZod(examMarkColumnsZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, classId, sectionId, subjectId } = parsed.data;

  try {
    const examResult = await readMany({
      drizzleSchema: exams,
      query: ({ db, instituteId }) =>
        db
          .select({ id: exams.id, name: exams.name })
          .from(exams)
          .innerJoin(
            examClasses,
            and(
              eq(examClasses.examId, exams.id),
              eq(examClasses.classId, classId),
              instituteScope(instituteId),
              eq(examClasses.status, "ACTIVE"),
            ),
          )
          .where(
            and(
              eq(exams.id, examId),
              or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
            ),
          )
          .limit(1),
    });

    const classResult = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db
          .select({ id: classesDrizzle.id, name: classesDrizzle.name })
          .from(classesDrizzle)
          .where(
            and(
              eq(classesDrizzle.id, classId),
              or(
                isNull(classesDrizzle.instituteId),
                eq(classesDrizzle.instituteId, instituteId),
              ),
            ),
          )
          .limit(1),
    });

    const filters = await getExamClassFilters(classId);

    const [markTypes, students, classTeacher] = await Promise.all([
      getSubjectMarkTypes(subjectId, ctx.instituteId),
      getSectionStudents(classId, sectionId),
      getClassTeacher(classId, sectionId),
    ]);

    const exam = (examResult.data as ExamRow[])?.[0];
    const classRow = (classResult.data as OptionRow[])?.[0];

    if (!exam) {
      return {
        success: false as const,
        error: "This exam is not assigned to the selected class",
        details: {},
      };
    }
    if (!classRow) {
      return { success: false as const, error: "Class not found", details: {} };
    }
    if (!filters.success) {
      return {
        success: false as const,
        error: "Failed to load sections and subjects",
        details: {},
      };
    }
    if (!markTypes.success) {
      return {
        success: false as const,
        error: markTypes.error,
        details: markTypes.details,
      };
    }
    if (!students.success || !classTeacher.success) {
      return {
        success: false as const,
        error: "Failed to load mark entry data",
        details: {},
      };
    }

    const section = filters.data.sections.find((item) => item.id === sectionId);
    if (!section) {
      return {
        success: false as const,
        error: "Section not found in this class",
        details: {},
      };
    }
    const subject = filters.data.subjects.find((item) => item.id === subjectId);
    if (!subject) {
      return {
        success: false as const,
        error: "Subject is not assigned to this class",
        details: {},
      };
    }

    const markTypeRows = markTypes.data as MarkTypeRow[];
    const savedMarks = await getSavedMarks({
      examId,
      subjectId,
      sectionId,
      instituteId: ctx.instituteId,
    });
    if (!savedMarks.success) {
      return {
        success: false as const,
        error: "Failed to load saved marks",
        details: {},
      };
    }

    // the sheet is submitted as a whole, so one submitted row means all are
    const entryStatus: MarkEntryStatus = [...savedMarks.data.values()].some(
      (saved) => saved.status === "SUBMITTED",
    )
      ? "SUBMITTED"
      : "DRAFT";

    // reuse the same guard the save path enforces, so the UI never offers an
    // edit the server would reject
    const permission = await checkEditPermission({
      examId,
      sectionId,
      subjectId,
      instituteId: ctx.instituteId,
      role: ctx.role,
      teacherId: ctx.teacherId,
    });
    const lock = await checkMarkLock(examId, ctx.instituteId);
    const latestRequest = await getLatestEditRequest({
      examId,
      sectionId,
      subjectId,
      instituteId: ctx.instituteId,
    });

    // show the paired paper alongside this sheet, when there is one
    const pair = await getCombinedPartner(subjectId, ctx.instituteId);
    const combined = pair
      ? await getCombinedDisplay({
          pair,
          currentSubjectId: subjectId,
          examId,
          sectionId,
          instituteId: ctx.instituteId,
          students: students.data as StudentRow[],
        })
      : null;

    const sheet: OutputMarkEntrySheetType = {
      exam,
      class: classRow,
      section,
      subject,
      sections: filters.data.sections,
      subjects: filters.data.subjects,
      classTeacher: classTeacher.data,
      markTypes: markTypeRows,
      totalMarks: markTypeRows.reduce((sum, type) => sum + type.fullMark, 0),
      entryStatus,
      canEdit: permission.allowed,
      lockReason: permission.allowed ? null : permission.error,
      markWorkflow: lock.workflow,
      combined,
      editRequest: latestRequest
        ? {
            id: latestRequest.id,
            status: latestRequest.status,
            reason: latestRequest.reason,
            resolutionNote: latestRequest.resolutionNote,
          }
        : null,
      rows: (students.data as StudentRow[]).map((row) => {
        const saved = savedMarks.data.get(row.studentId);
        return {
          ...row,
          status: saved?.status ?? null,
          marks: markTypeRows.map((type) => ({
            markTypeId: type.id,
            mark: saved?.marks.get(type.id)?.mark ?? 0,
            absent: saved?.marks.get(type.id)?.absent ?? false,
          })),
        };
      }),
    };

    return { success: true as const, data: sheet };
  } catch (error) {
    console.error("Failed to load mark entry sheet:", error);
    return {
      success: false as const,
      error: "Failed to load mark entry data",
      details: {},
    };
  }
}

// ================== save ==================

// validates the sheet against the subject's mark config and the section
// enrollment, then upserts one row per student / mark type.
//
// `intent: "DRAFT"` stores whatever was entered. `intent: "SUBMITTED"`
// additionally requires every enrolled student to be complete — marked
// absent, or a mark for each configured mark type — and flips the section's
// rows to SUBMITTED.
export async function saveMarkInput(data: InputSaveMarkInputType) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { userId, instituteId } = ctx;

  const parsed = parseWithZod(saveMarkInputZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, classId, sectionId, subjectId, rows, intent } = parsed.data;

  const studentIds = rows.map((row) => row.studentId);
  if (new Set(studentIds).size !== studentIds.length) {
    return {
      success: false as const,
      error: "Duplicate student rows",
      details: {},
    };
  }

  try {
    // once submitted, marks are frozen for teachers. Admins may always correct
    // them; a teacher needs an APPROVED request covering this exact scope.
    const lock = await checkEditPermission({
      examId,
      sectionId,
      subjectId,
      instituteId,
      role: ctx.role,
      teacherId: ctx.teacherId,
    });
    if (!lock.allowed) {
      return { success: false as const, error: lock.error, details: {} };
    }

    const [markTypes, enrolled] = await Promise.all([
      getSubjectMarkTypes(subjectId, instituteId),
      readMany({
        drizzleSchema: enrollments,
        query: ({ db, instituteId }) =>
          db
            .select({ id: enrollments.id, studentId: enrollments.studentId })
            .from(enrollments)
            .where(
              and(
                eq(enrollments.instituteId, instituteId),
                eq(enrollments.classId, classId),
                eq(enrollments.sectionId, sectionId),
                eq(enrollments.status, "ACTIVE"),
                inArray(enrollments.studentId, studentIds),
              ),
            ),
      }),
    ]);

    if (!markTypes.success) {
      return {
        success: false as const,
        error: markTypes.error,
        details: markTypes.details,
      };
    }
    if (!enrolled.success) {
      return {
        success: false as const,
        error: "Failed to verify students",
        details: {},
      };
    }

    const enrolledRows = enrolled.data as { id: string; studentId: string }[];
    const enrollmentByStudent = new Map(
      enrolledRows.map((row) => [row.studentId, row.id]),
    );
    if (enrolledRows.length !== studentIds.length) {
      return {
        success: false as const,
        error: "Some students are not enrolled in this section",
        details: {},
      };
    }

    const markTypeRows = markTypes.data as MarkTypeRow[];
    for (const row of rows) {
      if (row.absent) continue;

      for (const entry of row.marks) {
        const markType = markTypeRows.find(
          (type) => type.id === entry.markTypeId,
        );
        if (!markType) {
          return {
            success: false as const,
            error: "Mark type is not configured for this subject",
            details: {},
          };
        }
        if (entry.mark > markType.fullMark) {
          return {
            success: false as const,
            error: `${markType.name} mark cannot exceed ${markType.fullMark}`,
            details: {},
          };
        }
      }
    }

    // submitting means the whole section is finished, so every student needs
    // either the absent flag or a mark for each configured mark type
    if (intent === "SUBMITTED") {
      const expectedIds = new Set(markTypeRows.map((type) => type.id));
      for (const row of rows) {
        if (row.absent) continue;

        const entered = new Set(
          row.marks.filter((entry) => expectedIds.has(entry.markTypeId))
            .map((entry) => entry.markTypeId),
        );
        if (entered.size === expectedIds.size) continue;

        const missing = markTypeRows
          .filter((type) => !entered.has(type.id))
          .map((type) => type.name)
          .join(", ");

        return {
          success: false as const,
          error: `Missing ${missing} for ${row.studentId}`,
          details: {},
        };
      }
    }

    const values = rows.flatMap((row) => {
      const enrollmentId = enrollmentByStudent.get(row.studentId);
      if (!enrollmentId) return [];

      return row.marks.map((entry) => ({
        instituteId,
        examId,
        enrollmentId,
        subjectId,
        markTypeId: entry.markTypeId,
        mark: row.absent ? 0 : Math.round(entry.mark),
        absent: row.absent,
        entryStatus: intent,
      }));
    });

    // the approved request that permitted this write, if the teacher needed one
    const approvedRequest = await getApprovedRequest({
      examId,
      sectionId,
      subjectId,
      instituteId,
    });

    await db.transaction(async (tx) => {
      // read the current values first so the correction trail can record what
      // each cell held before this save overwrote it
      const before = await tx
        .select({
          enrollmentId: examMarks.enrollmentId,
          markTypeId: examMarks.markTypeId,
          mark: examMarks.mark,
          absent: examMarks.absent,
        })
        .from(examMarks)
        .where(
          and(
            eq(examMarks.instituteId, instituteId),
            eq(examMarks.examId, examId),
            eq(examMarks.subjectId, subjectId),
            eq(examMarks.status, "ACTIVE"),
            inArray(examMarks.enrollmentId, [...enrollmentByStudent.values()]),
          ),
        );

      const beforeKey = (enrollmentId: string, markTypeId: string) =>
        `${enrollmentId}:${markTypeId}`;
      const beforeMap = new Map(
        before.map((row) => [beforeKey(row.enrollmentId, row.markTypeId), row]),
      );

      // only cells that actually moved are recorded, so re-saving unchanged
      // marks does not fill the trail with noise
      const corrections = values.flatMap((value) => {
        const previous = beforeMap.get(
          beforeKey(value.enrollmentId, value.markTypeId),
        );
        const oldMark = previous?.mark ?? null;
        const oldAbsent = previous?.absent ?? null;

        const changed =
          previous === undefined ||
          previous.mark !== value.mark ||
          previous.absent !== value.absent;
        if (!changed) return [];

        return [
          {
            instituteId,
            examId,
            enrollmentId: value.enrollmentId,
            subjectId,
            markTypeId: value.markTypeId,
            oldMark,
            newMark: value.mark,
            oldAbsent,
            newAbsent: value.absent,
            editedById: userId,
            editedByRole: ctx.role ?? "user",
            editRequestId: approvedRequest?.id ?? null,
            approvedById: approvedRequest?.resolvedById ?? null,
            reason: approvedRequest?.reason ?? null,
          },
        ];
      });

      if (corrections.length > 0) {
        await tx.insert(examMarkCorrections).values(corrections);
      }

      if (values.length > 0) {
        await tx
          .insert(examMarks)
          .values(values)
          .onConflictDoUpdate({
            target: [
              examMarks.examId,
              examMarks.enrollmentId,
              examMarks.subjectId,
              examMarks.markTypeId,
            ],
            set: {
              mark: sql`excluded.mark`,
              absent: sql`excluded.absent`,
              entryStatus: sql`excluded.entry_status`,
              status: "ACTIVE",
              updatedAt: new Date(),
            },
          });
      }

      // submitting covers the whole section, so students the teacher left
      // untouched are promoted too — otherwise the sheet would stay half
      // draft after it was signed off.
      if (intent === "SUBMITTED") {
        await tx
          .update(examMarks)
          .set({ entryStatus: "SUBMITTED", updatedAt: new Date() })
          .where(
            and(
              eq(examMarks.instituteId, instituteId),
              eq(examMarks.examId, examId),
              eq(examMarks.subjectId, subjectId),
              eq(examMarks.status, "ACTIVE"),
              inArray(examMarks.enrollmentId, [...enrollmentByStudent.values()]),
              eq(examMarks.entryStatus, "DRAFT"),
            ),
          );
      }

      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "UPDATED",
        entity: "MARK",
        entityId: examId,
        description: `${intent === "SUBMITTED" ? "submitted" : "saved"} marks for ${rows.length} students`,
        metadata: {
          examId,
          classId,
          sectionId,
          subjectId,
          intent,
          rows: rows.length,
          corrections: corrections.length,
        },
      });
    });

    revalidatePath("/dashboard/exam/mark-input");
    revalidatePath(`/dashboard/exam/mark-entry/${examId}`);

    return {
      success: true as const,
      data: {
        examId,
        classId,
        sectionId,
        subjectId,
        intent,
        savedRows: rows.length,
        absentRows: rows.filter((row) => row.absent).length,
      },
    };
  } catch (error) {
    console.error("Failed to save marks:", error);
    return {
      success: false as const,
      error: "Failed to save marks",
      details: {},
    };
  }
}

// ================== helpers ==================

// Whether the exam itself is locked. Finalizing or publishing an exam freezes
// every mark in it, so even an admin — and even an approved edit request —
// cannot write. This is checked before any other permission so the lock wins.
async function checkMarkLock(
  examId: string,
  instituteId: string,
): Promise<
  | { locked: false; workflow: MarkWorkflow }
  | { locked: true; workflow: MarkWorkflow; error: string }
> {
  const rows = await db
    .select({ markWorkflow: exams.markWorkflow })
    .from(exams)
    .where(
      and(
        eq(exams.id, examId),
        or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
      ),
    )
    .limit(1);

  const workflow = (rows[0]?.markWorkflow ?? "OPEN") as MarkWorkflow;
  if (workflow === "OPEN") return { locked: false, workflow };

  return {
    locked: true,
    workflow,
    error:
      workflow === "PUBLISHED"
        ? "The results for this exam are published, so marks can no longer be changed."
        : "This exam is finalized, so marks can no longer be changed. An admin must reopen it first.",
  };
}

// Whether the caller may write marks for this exam + section + subject.
// Submitted marks are frozen for teachers unless an admin approved a request
// for that exact scope. Enforced here so hiding UI controls is never the guard.
async function checkEditPermission({
  examId,
  sectionId,
  subjectId,
  instituteId,
  role,
  teacherId,
}: {
  examId: string;
  sectionId: string;
  subjectId: string;
  instituteId: string;
  role: string | null | undefined;
  teacherId: string | undefined;
}): Promise<
  | { allowed: true }
  | { allowed: false; error: string; lockReason?: string }
> {
  // the exam-level lock outranks every other rule
  const lock = await checkMarkLock(examId, instituteId);
  if (lock.locked) {
    return { allowed: false, error: lock.error, lockReason: lock.error };
  }

  const admin = role === "admin";

  // a teacher must own the section + subject assignment
  if (!admin) {
    if (!teacherId) return { allowed: false, error: "Not authorized" };

    const assigned = await db
      .select({ id: sectionSubjectTeachers.id })
      .from(sectionSubjectTeachers)
      .where(
        and(
          eq(sectionSubjectTeachers.instituteId, instituteId),
          eq(sectionSubjectTeachers.sectionId, sectionId),
          eq(sectionSubjectTeachers.subjectId, subjectId),
          eq(sectionSubjectTeachers.teacherId, teacherId),
          eq(sectionSubjectTeachers.status, "ACTIVE"),
        ),
      )
      .limit(1);
    if (!assigned[0]) {
      return {
        allowed: false,
        error: "You are not assigned to this section and subject",
      };
    }
  }

  // is any row for this scope already submitted?
  const submitted = await db
    .select({ id: examMarks.id })
    .from(examMarks)
    .innerJoin(enrollments, eq(enrollments.id, examMarks.enrollmentId))
    .where(
      and(
        eq(examMarks.instituteId, instituteId),
        eq(examMarks.examId, examId),
        eq(examMarks.subjectId, subjectId),
        eq(examMarks.entryStatus, "SUBMITTED"),
        eq(examMarks.status, "ACTIVE"),
        eq(enrollments.sectionId, sectionId),
      ),
    )
    .limit(1);

  if (!submitted[0]) return { allowed: true };
  if (admin) return { allowed: true };

  // a teacher needs an approved request for exactly this scope
  const approved = await db
    .select({ id: examMarkEditRequests.id })
    .from(examMarkEditRequests)
    .where(
      and(
        eq(examMarkEditRequests.instituteId, instituteId),
        eq(examMarkEditRequests.examId, examId),
        eq(examMarkEditRequests.sectionId, sectionId),
        eq(examMarkEditRequests.subjectId, subjectId),
        eq(examMarkEditRequests.status, "APPROVED"),
      ),
    )
    .limit(1);

  if (approved[0]) return { allowed: true };

  return {
    allowed: false,
    error:
      "These marks are already submitted. Request permission before editing them.",
  };
}

// the most recent edit request for one scope, if any. Surfaced on the mark
// sheet so the UI can show "pending" or "approved" next to the lock.
async function getLatestEditRequest({
  examId,
  sectionId,
  subjectId,
  instituteId,
}: {
  examId: string;
  sectionId: string;
  subjectId: string;
  instituteId: string;
}) {
  const rows = await db
    .select({
      id: examMarkEditRequests.id,
      status: examMarkEditRequests.status,
      reason: examMarkEditRequests.reason,
      resolutionNote: examMarkEditRequests.resolutionNote,
    })
    .from(examMarkEditRequests)
    .where(
      and(
        eq(examMarkEditRequests.instituteId, instituteId),
        eq(examMarkEditRequests.examId, examId),
        eq(examMarkEditRequests.sectionId, sectionId),
        eq(examMarkEditRequests.subjectId, subjectId),
      ),
    )
    .orderBy(desc(examMarkEditRequests.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

// the latest approved request for one scope. Corrections made under an
// approval are stamped with it so the trail shows who authorised the change.
async function getApprovedRequest({
  examId,
  sectionId,
  subjectId,
  instituteId,
}: {
  examId: string;
  sectionId: string;
  subjectId: string;
  instituteId: string;
}) {
  const rows = await db
    .select({
      id: examMarkEditRequests.id,
      reason: examMarkEditRequests.reason,
      resolvedById: examMarkEditRequests.resolvedById,
    })
    .from(examMarkEditRequests)
    .where(
      and(
        eq(examMarkEditRequests.instituteId, instituteId),
        eq(examMarkEditRequests.examId, examId),
        eq(examMarkEditRequests.sectionId, sectionId),
        eq(examMarkEditRequests.subjectId, subjectId),
        eq(examMarkEditRequests.status, "APPROVED"),
      ),
    )
    .orderBy(desc(examMarkEditRequests.resolvedAt))
    .limit(1);

  return rows[0] ?? null;
}

// mark types (CQ, MCQ, …) configured for a subject, tenant or global defaults.
// `subject_mark_templates` has no instituteId (it hangs off the subject), so it
// can't go through readMany — the subject is verified institute-scoped here
// before its templates are read.
async function getSubjectMarkTypes(subjectId: string, instituteId: string) {
  const subject = await db
    .select({ id: subjectDbSchema.id })
    .from(subjectDbSchema)
    .where(
      and(
        eq(subjectDbSchema.id, subjectId),
        eq(subjectDbSchema.status, "ACTIVE"),
        or(
          isNull(subjectDbSchema.instituteId),
          eq(subjectDbSchema.instituteId, instituteId),
        ),
      ),
    )
    .limit(1);

  if (!subject[0]) {
    return {
      success: false as const,
      error: "Subject not found",
      details: {},
    };
  }

  const rows = await db
    .select({
      id: examMarkTypesDrizzle.id,
      name: examMarkTypesDrizzle.name,
      fullMark: subjectMarkTemplates.fullMark,
      passMark: subjectMarkTemplates.passMark,
    })
    .from(subjectMarkTemplates)
    .innerJoin(
      examMarkTypesDrizzle,
      eq(examMarkTypesDrizzle.id, subjectMarkTemplates.markTypeId),
    )
    .where(
      and(
        eq(subjectMarkTemplates.subjectId, subjectId),
        eq(subjectMarkTemplates.status, "ACTIVE"),
        eq(examMarkTypesDrizzle.status, "ACTIVE"),
        or(
          isNull(examMarkTypesDrizzle.instituteId),
          eq(examMarkTypesDrizzle.instituteId, instituteId),
        ),
      ),
    )
    .orderBy(asc(examMarkTypesDrizzle.createdAt));

  return { success: true as const, data: rows, details: {} };
}

// active students enrolled in the section, ordered by roll
async function getSectionStudents(classId: string, sectionId: string) {
  return readMany({
    drizzleSchema: enrollments,
    query: ({ db, instituteId }) =>
      db
        .select({
          studentId: student.id,
          roll: enrollments.roll,
          englishName: student.englishName,
          banglaName: student.banglaName,
        })
        .from(enrollments)
        .innerJoin(student, eq(student.id, enrollments.studentId))
        .where(
          and(
            eq(enrollments.instituteId, instituteId),
            eq(enrollments.classId, classId),
            eq(enrollments.sectionId, sectionId),
            eq(enrollments.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(enrollments.roll)),
  });
}

// The other paper of a combined pair (English 1st + 2nd), if this subject has
// one. The pair is stored as two ordinary subjects — the second paper points at
// the first with `combineWith` — so the partner sits at either end of the
// pointer. Display only: nothing here changes what is stored or entered.
async function getCombinedPartner(subjectId: string, instituteId: string) {
  const rows = await db
    .select({
      id: subjectDbSchema.id,
      name: subjectDbSchema.name,
      combineWith: subjectDbSchema.combineWith,
      combineLabel: subjectDbSchema.combineLabel,
    })
    .from(subjectDbSchema)
    .where(
      and(
        or(
          eq(subjectDbSchema.id, subjectId),
          eq(subjectDbSchema.combineWith, subjectId),
        ),
        or(
          isNull(subjectDbSchema.instituteId),
          eq(subjectDbSchema.instituteId, instituteId),
        ),
      ),
    );

  const current = rows.find((row) => row.id === subjectId);
  if (!current?.combineLabel) return null;

  const anchorId = current.combineWith ?? current.id;
  const anchor = rows.find((row) => row.id === anchorId);
  const partner = rows.find(
    (row) => row.id !== subjectId && (row.combineWith ?? row.id) === anchorId,
  );
  if (!anchor || !partner) return null;

  return {
    label: current.combineLabel,
    // 1st paper is the anchor, 2nd paper points at it
    first: current.combineWith ? partner : current,
    second: current.combineWith ? current : partner,
  };
}

// Both papers' marks for this exam, so the sheet can show the pair together.
// Marks are read per paper and never merged in storage.
async function getCombinedDisplay({
  pair,
  currentSubjectId,
  examId,
  sectionId,
  instituteId,
  students,
}: {
  pair: {
    label: string;
    first: { id: string; name: string };
    second: { id: string; name: string };
  };
  currentSubjectId: string;
  examId: string;
  sectionId: string;
  instituteId: string;
  students: StudentRow[];
}) {
  const papers = await Promise.all(
    [pair.first, pair.second].map(async (paper) => {
      const [markTypes, savedMarks] = await Promise.all([
        getSubjectMarkTypes(paper.id, instituteId),
        getSavedMarks({ examId, subjectId: paper.id, sectionId, instituteId }),
      ]);

      const fullMark = markTypes.success
        ? (markTypes.data as MarkTypeRow[]).reduce(
            (sum, type) => sum + type.fullMark,
            0,
          )
        : 0;

      return { ...paper, fullMark, saved: savedMarks.data };
    }),
  );

  return {
    label: pair.label,
    position: (currentSubjectId === pair.first.id ? 0 : 1) as 0 | 1,
    papers: papers.map((paper) => ({
      id: paper.id,
      name: paper.name,
      fullMark: paper.fullMark,
    })),
    // one row per student, so the two papers are compared student by student
    students: students.map((student) => ({
      studentId: student.studentId,
      roll: student.roll,
      englishName: student.englishName,
      papers: papers.map((paper) => {
        const saved = paper.saved?.get(student.studentId);
        const marks = saved
          ? [...saved.marks.entries()].map(([markTypeId, value]) => ({
              markTypeId,
              mark: value.mark,
              absent: value.absent,
            }))
          : [];
        // a paper counts as sat when at least one mark type is not absent
        const sat = marks.filter((mark) => !mark.absent);
        const absent = marks.length > 0 && sat.length === 0;

        return {
          id: paper.id,
          absent,
          marks,
          total:
            marks.length === 0
              ? null
              : absent
                ? 0
                : sat.reduce((sum, mark) => sum + mark.mark, 0),
        };
      }),
    })),
  };
}

// saved marks for this exam + subject, keyed by studentId -> markTypeId.
// scoped to the section's enrollments so a student saved elsewhere can never
// surface in this sheet.
async function getSavedMarks({
  examId,
  subjectId,
  sectionId,
  instituteId,
}: {
  examId: string;
  subjectId: string;
  sectionId: string;
  instituteId: string;
}) {
  const rows = await db
    .select({
      studentId: enrollments.studentId,
      markTypeId: examMarks.markTypeId,
      mark: examMarks.mark,
      absent: examMarks.absent,
      entryStatus: examMarks.entryStatus,
    })
    .from(examMarks)
    .innerJoin(enrollments, eq(enrollments.id, examMarks.enrollmentId))
    .where(
      and(
        eq(examMarks.instituteId, instituteId),
        eq(examMarks.examId, examId),
        eq(examMarks.subjectId, subjectId),
        eq(examMarks.status, "ACTIVE"),
        eq(enrollments.sectionId, sectionId),
      ),
    );

  const byStudent = new Map<string, SavedMarkState>();
  for (const row of rows) {
    const saved = byStudent.get(row.studentId) ?? {
      status: "DRAFT" as MarkEntryStatus,
      marks: new Map<string, { mark: number; absent: boolean }>(),
    };

    saved.marks.set(row.markTypeId, {
      mark: row.mark,
      absent: row.absent,
    });
    // submitted wins if any row for the student was submitted
    if (row.entryStatus === "SUBMITTED") saved.status = "SUBMITTED";

    byStudent.set(row.studentId, saved);
  }

  return { success: true as const, data: byStudent, details: {} };
}

// the class teacher assigned to the section
async function getClassTeacher(classId: string, sectionId: string) {
  const result = await readMany({
    drizzleSchema: sectionClassTeachers,
    query: ({ db, instituteId }) =>
      db
        .select({ id: teachers.id, nameEnglish: teachers.nameEnglish })
        .from(sectionClassTeachers)
        .innerJoin(teachers, eq(teachers.id, sectionClassTeachers.teacherId))
        .where(
          and(
            eq(sectionClassTeachers.instituteId, instituteId),
            eq(sectionClassTeachers.classId, classId),
            eq(sectionClassTeachers.sectionId, sectionId),
            eq(sectionClassTeachers.status, "ACTIVE"),
            eq(teachers.status, "ACTIVE"),
          ),
        )
        .limit(1),
  });

  if (!result.success) {
    return { success: false as const, data: null };
  }
  return {
    success: true as const,
    data: (result.data as TeacherRow[])[0] ?? null,
  };
}
