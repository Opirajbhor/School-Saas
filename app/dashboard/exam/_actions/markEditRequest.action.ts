"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import { db } from "@/src/drizzle-DB";
import {
  classesDrizzle,
  enrollments,
  examMarkCorrections,
  examMarkEditRequests,
  examMarks,
  examMarkTypesDrizzle,
  exams,
  sectionDrizzle,
  sectionSubjectTeachers,
  student,
  subjectAssignSchema,
  subjectDbSchema,
  teachers,
  user,
} from "@/src/drizzle-DB/schema";
import {
  InputMarkEditRequestType,
  InputResolveMarkEditRequestType,
  InputSetExamWorkflowType,
  markEditRequestZod,
  markCorrectionScopeZod,
  OutputMarkCorrectionType,
  OutputMarkEditRequestType,
  resolveMarkEditRequestZod,
  setExamWorkflowZod,
  ExamMarkWorkflowType,
} from "../_schema/exam.zod";

// ================== shared guards ==================

// a teacher may touch a section + subject only when it is assigned to them.
// admins are limited to their own institute's data.
async function assertScopeAccess({
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
}) {
  const examRows = await db
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.id, examId),
        or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
      ),
    )
    .limit(1);
  if (!examRows[0]) {
    return { ok: false as const, error: "Exam not found" };
  }

  // the section must belong to the institute
  const sectionRows = await db
    .select({ id: sectionDrizzle.id, classId: sectionDrizzle.classId })
    .from(sectionDrizzle)
    .where(
      and(
        eq(sectionDrizzle.id, sectionId),
        eq(sectionDrizzle.instituteId, instituteId),
      ),
    )
    .limit(1);
  const section = sectionRows[0];
  if (!section) {
    return { ok: false as const, error: "Section not found" };
  }

  // the subject must be assigned to that section's class
  const assignment = await db
    .select({ id: subjectAssignSchema.id })
    .from(subjectAssignSchema)
    .where(
      and(
        eq(subjectAssignSchema.classId, section.classId),
        eq(subjectAssignSchema.subjectId, subjectId),
        eq(subjectAssignSchema.status, "ACTIVE"),
        or(
          isNull(subjectAssignSchema.instituteId),
          eq(subjectAssignSchema.instituteId, instituteId),
        ),
      ),
    )
    .limit(1);
  if (!assignment[0]) {
    return {
      ok: false as const,
      error: "Subject is not assigned to this section",
    };
  }

  if (role !== "admin") {
    if (!teacherId) {
      return { ok: false as const, error: "Not authorized" };
    }
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
        ok: false as const,
        error: "You are not assigned to this section and subject",
      };
    }
  }

  return { ok: true as const, classId: section.classId };
}

// ================== teacher: request an unlock ==================

export async function requestMarkEdit(data: InputMarkEditRequestType) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { instituteId, teacherId, userId } = ctx;

  const parsed = parseWithZod(markEditRequestZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, sectionId, subjectId, reason } = parsed.data;

  try {
    const access = await assertScopeAccess({
      examId,
      sectionId,
      subjectId,
      instituteId,
      role: ctx.role,
      teacherId,
    });
    if (!access.ok) {
      return { success: false as const, error: access.error, details: {} };
    }
    if (!teacherId) {
      return {
        success: false as const,
        error: "Only teachers can request an edit",
        details: {},
      };
    }

    // the marks must actually be submitted — otherwise no unlock is needed
    const submitted = await db
      .select({ id: examMarks.id })
      .from(examMarks)
      .where(
        and(
          eq(examMarks.instituteId, instituteId),
          eq(examMarks.examId, examId),
          eq(examMarks.subjectId, subjectId),
          eq(examMarks.entryStatus, "SUBMITTED"),
          eq(examMarks.status, "ACTIVE"),
        ),
      )
      .limit(1);
    if (!submitted[0]) {
      return {
        success: false as const,
        error: "These marks are not submitted yet, so they can still be edited",
        details: {},
      };
    }

    // one open request per scope
    const existing = await db
      .select({ id: examMarkEditRequests.id })
      .from(examMarkEditRequests)
      .where(
        and(
          eq(examMarkEditRequests.instituteId, instituteId),
          eq(examMarkEditRequests.examId, examId),
          eq(examMarkEditRequests.sectionId, sectionId),
          eq(examMarkEditRequests.subjectId, subjectId),
          eq(examMarkEditRequests.status, "PENDING"),
        ),
      )
      .limit(1);
    if (existing[0]) {
      return {
        success: false as const,
        error: "An edit request for this section and subject is already pending",
        details: {},
      };
    }

    const request = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(examMarkEditRequests)
        .values({
          instituteId,
          examId,
          classId: access.classId,
          sectionId,
          subjectId,
          requestedById: teacherId,
          reason,
          status: "PENDING",
        })
        .returning();

      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "CREATED",
        entity: "MARK",
        entityId: examId,
        description: "requested permission to edit submitted marks",
        metadata: { examId, sectionId, subjectId, requestId: created.id },
      });

      return created;
    });

    revalidatePath("/dashboard/exam/mark-input");
    revalidatePath(`/dashboard/exam/${examId}`);

    return { success: true as const, data: request };
  } catch (error) {
    console.error("Failed to create mark edit request:", error);
    return {
      success: false as const,
      error: "Failed to create edit request",
      details: {},
    };
  }
}

// ================== admin: approve or reject ==================

export async function resolveMarkEditRequest(
  data: InputResolveMarkEditRequestType,
) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { instituteId, userId, teacherId } = ctx;

  // only admins resolve requests
  if (ctx.role !== "admin") {
    return { success: false as const, error: "Not authorized", details: {} };
  }

  const parsed = parseWithZod(resolveMarkEditRequestZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { requestId, decision, resolutionNote } = parsed.data;

  try {
    const rows = await db
      .select({
        id: examMarkEditRequests.id,
        examId: examMarkEditRequests.examId,
        sectionId: examMarkEditRequests.sectionId,
        subjectId: examMarkEditRequests.subjectId,
        status: examMarkEditRequests.status,
      })
      .from(examMarkEditRequests)
      .where(
        and(
          eq(examMarkEditRequests.id, requestId),
          eq(examMarkEditRequests.instituteId, instituteId),
        ),
      )
      .limit(1);

    const request = rows[0];
    if (!request) {
      return { success: false as const, error: "Request not found", details: {} };
    }
    if (request.status !== "PENDING") {
      return {
        success: false as const,
        error: "This request has already been resolved",
        details: {},
      };
    }

    // a locked exam cannot be reopened by approving a request, so refuse here
    // rather than letting the teacher believe they can edit again
    if (decision === "APPROVED") {
      const examRows = await db
        .select({ markWorkflow: exams.markWorkflow })
        .from(exams)
        .where(eq(exams.id, request.examId))
        .limit(1);
      const workflow = examRows[0]?.markWorkflow ?? "OPEN";
      if (workflow !== "OPEN") {
        return {
          success: false as const,
          error:
            workflow === "PUBLISHED"
              ? "This exam's results are published, so it can no longer be reopened."
              : "This exam is finalized. Reopen it before approving edit requests.",
          details: {},
        };
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(examMarkEditRequests)
        .set({
          status: decision,
          resolutionNote: resolutionNote ?? null,
          resolvedById: teacherId ?? null,
          resolvedAt: new Date(),
        })
        .where(eq(examMarkEditRequests.id, requestId));

      // approving re-opens exactly this scope: the unit's rows drop back to
      // draft so the teacher can save again. Nothing outside the scope changes.
      if (decision === "APPROVED") {
        await tx
          .update(examMarks)
          .set({ entryStatus: "DRAFT", updatedAt: new Date() })
          .where(
            and(
              eq(examMarks.instituteId, instituteId),
              eq(examMarks.examId, request.examId),
              eq(examMarks.subjectId, request.subjectId),
              eq(examMarks.status, "ACTIVE"),
              inArray(
                examMarks.enrollmentId,
                tx
                  .select({ id: enrollments.id })
                  .from(enrollments)
                  .where(eq(enrollments.sectionId, request.sectionId)),
              ),
            ),
          );
      }

      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "UPDATED",
        entity: "MARK",
        entityId: request.examId,
        description: `${decision === "APPROVED" ? "approved" : "rejected"} a mark edit request`,
        metadata: {
          requestId,
          examId: request.examId,
          sectionId: request.sectionId,
          subjectId: request.subjectId,
          decision,
        },
      });
    });

    revalidatePath("/dashboard/exam/mark-input");
    revalidatePath(`/dashboard/exam/${request.examId}`);

    return { success: true as const, data: { requestId, decision } };
  } catch (error) {
    console.error("Failed to resolve mark edit request:", error);
    return {
      success: false as const,
      error: "Failed to resolve edit request",
      details: {},
    };
  }
}

// ================== listing ==================

// requests visible to the caller: admins see the institute, teachers see theirs
export async function getMarkEditRequests(examId?: string) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { instituteId, role, teacherId } = ctx;

  try {
    const requestedBy = alias(teachers, "requested_by");
    const resolvedBy = alias(teachers, "resolved_by");

    const rows = await db
      .select({
        id: examMarkEditRequests.id,
        status: examMarkEditRequests.status,
        reason: examMarkEditRequests.reason,
        resolutionNote: examMarkEditRequests.resolutionNote,
        resolvedAt: examMarkEditRequests.resolvedAt,
        createdAt: examMarkEditRequests.createdAt,
        examId: exams.id,
        examName: exams.name,
        classId: classesDrizzle.id,
        className: classesDrizzle.name,
        sectionId: sectionDrizzle.id,
        sectionName: sectionDrizzle.name,
        subjectId: subjectDbSchema.id,
        subjectName: subjectDbSchema.name,
        requestedById: requestedBy.id,
        requestedByName: requestedBy.nameEnglish,
        resolvedByName: resolvedBy.nameEnglish,
      })
      .from(examMarkEditRequests)
      .innerJoin(exams, eq(exams.id, examMarkEditRequests.examId))
      .innerJoin(
        classesDrizzle,
        eq(classesDrizzle.id, examMarkEditRequests.classId),
      )
      .innerJoin(
        sectionDrizzle,
        eq(sectionDrizzle.id, examMarkEditRequests.sectionId),
      )
      .innerJoin(
        subjectDbSchema,
        eq(subjectDbSchema.id, examMarkEditRequests.subjectId),
      )
      .leftJoin(
        requestedBy,
        eq(requestedBy.id, examMarkEditRequests.requestedById),
      )
      .leftJoin(
        resolvedBy,
        eq(resolvedBy.id, examMarkEditRequests.resolvedById),
      )
      .where(
        and(
          eq(examMarkEditRequests.instituteId, instituteId),
          examId ? eq(examMarkEditRequests.examId, examId) : undefined,
          // a teacher only sees their own requests
          role === "admin"
            ? undefined
            : eq(examMarkEditRequests.requestedById, teacherId ?? ""),
        ),
      )
      .orderBy(desc(examMarkEditRequests.createdAt));

    const data: OutputMarkEditRequestType[] = rows.map((row) => ({
      id: row.id,
      status: row.status,
      reason: row.reason,
      resolutionNote: row.resolutionNote,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
      exam: { id: row.examId, name: row.examName },
      class: { id: row.classId, name: row.className },
      section: { id: row.sectionId, name: row.sectionName },
      subject: { id: row.subjectId, name: row.subjectName },
      requestedBy: row.requestedById
        ? { id: row.requestedById, nameEnglish: row.requestedByName ?? "" }
        : null,
      resolvedBy: row.resolvedByName
        ? { id: "", nameEnglish: row.resolvedByName }
        : null,
    }));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load mark edit requests:", error);
    return {
      success: false as const,
      error: "Failed to load edit requests",
      details: {},
    };
  }
}

// ================== exam-level lock (finalize / publish) ==================

// Moves the exam between OPEN, FINALIZED and PUBLISHED. Only an admin may do
// this, and PUBLISHED is terminal: results that are out cannot be pulled back
// without losing the promise the publish made.
export async function setExamMarkWorkflow(data: InputSetExamWorkflowType) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  if (ctx.role !== "admin") {
    return { success: false as const, error: "Not authorized", details: {} };
  }
  const { instituteId, userId } = ctx;

  const parsed = parseWithZod(setExamWorkflowZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, workflow } = parsed.data;

  try {
    const rows = await db
      .select({ id: exams.id, markWorkflow: exams.markWorkflow })
      .from(exams)
      .where(
        and(
          eq(exams.id, examId),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
      )
      .limit(1);

    const exam = rows[0];
    if (!exam) {
      return { success: false as const, error: "Exam not found", details: {} };
    }
    if (exam.markWorkflow === workflow) {
      return {
        success: false as const,
        error: `The exam is already ${workflow.toLowerCase()}`,
        details: {},
      };
    }
    if (exam.markWorkflow === "PUBLISHED") {
      return {
        success: false as const,
        error: "Published results cannot be reopened",
        details: {},
      };
    }

    const now = new Date();
    const patch =
      workflow === "FINALIZED"
        ? { finalizedAt: now, finalizedById: userId }
        : workflow === "PUBLISHED"
          ? { publishedAt: now, publishedById: userId }
          : // reopening clears only the finalize stamp; publish can't be undone
            { finalizedAt: null, finalizedById: null };

    await db.transaction(async (tx) => {
      await tx
        .update(exams)
        .set({ markWorkflow: workflow, ...patch, updatedAt: now })
        .where(eq(exams.id, examId));

      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "STATUS_CHANGED",
        entity: "EXAM",
        entityId: examId,
        description:
          workflow === "OPEN"
            ? "reopened mark entry for an exam"
            : workflow === "FINALIZED"
              ? "finalized an exam's marks"
              : "published an exam's results",
        metadata: {
          examId,
          from: exam.markWorkflow,
          to: workflow,
        },
      });
    });

    revalidatePath("/dashboard/exam");
    revalidatePath(`/dashboard/exam/${examId}`);
    revalidatePath("/dashboard/exam/mark-input");

    return { success: true as const, data: { examId, workflow } };
  } catch (error) {
    console.error("Failed to set exam mark workflow:", error);
    return {
      success: false as const,
      error: "Failed to update the exam lock",
      details: {},
    };
  }
}

// Current lock state for one exam, with the admin who applied it and a count of
// units that are still incomplete so the UI can warn before finalizing.
export async function getExamMarkWorkflow(
  examId: string,
): Promise<
  | { success: true; data: ExamMarkWorkflowType; details: object }
  | { success: false; error: string; details: object }
> {
  const ctx = await getUserContext();
  if (!ctx) {
    return { success: false, error: "No User session found", details: {} };
  }
  const { instituteId } = ctx;

  try {
    const finalizedBy = alias(user, "finalized_by");
    const publishedBy = alias(user, "published_by");

    const rows = await db
      .select({
        examId: exams.id,
        workflow: exams.markWorkflow,
        finalizedAt: exams.finalizedAt,
        finalizedByName: finalizedBy.name,
        publishedAt: exams.publishedAt,
        publishedByName: publishedBy.name,
      })
      .from(exams)
      .leftJoin(finalizedBy, eq(finalizedBy.id, exams.finalizedById))
      .leftJoin(publishedBy, eq(publishedBy.id, exams.publishedById))
      .where(
        and(
          eq(exams.id, examId),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      return { success: false, error: "Exam not found", details: {} };
    }

    // an exam with nothing entered is not "incomplete" in a meaningful way
    const incomplete = await countIncompleteUnits(examId, instituteId);

    return {
      success: true as const,
      data: {
        examId: row.examId,
        workflow: row.workflow as ExamMarkWorkflowType["workflow"],
        finalizedAt: row.finalizedAt,
        finalizedByName: row.finalizedByName,
        publishedAt: row.publishedAt,
        publishedByName: row.publishedByName,
        incompleteUnits: incomplete,
      },
      details: {},
    };
  } catch (error) {
    console.error("Failed to load exam mark workflow:", error);
    return {
      success: false,
      error: "Failed to load the exam lock",
      details: {},
    };
  }
}

// How many monitored units still have marks that were never submitted. Used
// only to warn, never to block finalizing.
async function countIncompleteUnits(examId: string, instituteId: string) {
  // a unit is a section + subject pair; a pair is complete when it has at least
  // one submitted row, so the count of never-submitted pairs is the shortfall
  const units = await db
    .select({
      sectionId: enrollments.sectionId,
      subjectId: examMarks.subjectId,
      submitted: sql<number>`count(*) filter (where ${examMarks.entryStatus} = 'SUBMITTED')`.mapWith(
        Number,
      ),
    })
    .from(examMarks)
    .innerJoin(enrollments, eq(enrollments.id, examMarks.enrollmentId))
    .where(
      and(
        eq(examMarks.instituteId, instituteId),
        eq(examMarks.examId, examId),
        eq(examMarks.status, "ACTIVE"),
      ),
    )
    .groupBy(enrollments.sectionId, examMarks.subjectId);

  return units.filter((unit) => unit.submitted === 0).length;
}

// ================== correction history ==================

// The audit trail for one section + subject: every mark that was changed after
// it was first stored, with the old and new value, who changed it and who
// approved it.
export async function getMarkCorrections(data: {
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
}): Promise<
  | { success: true; data: OutputMarkCorrectionType[]; details: object }
  | { success: false; error: string; details: object }
> {
  const ctx = await getUserContext();
  if (!ctx) {
    return { success: false, error: "No User session found", details: {} };
  }
  const { instituteId } = ctx;

  const parsed = parseWithZod(markCorrectionScopeZod, data);
  if (!parsed.success) {
    return { success: false, error: parsed.error, details: parsed.details };
  }
  const { examId, sectionId, subjectId } = parsed.data;

  try {
    const approvedBy = alias(user, "correction_approved_by");

    const rows = await db
      .select({
        id: examMarkCorrections.id,
        createdAt: examMarkCorrections.createdAt,
        studentId: enrollments.studentId,
        roll: enrollments.roll,
        englishName: student.englishName,
        banglaName: student.banglaName,
        markTypeName: examMarkTypesDrizzle.name,
        oldMark: examMarkCorrections.oldMark,
        newMark: examMarkCorrections.newMark,
        oldAbsent: examMarkCorrections.oldAbsent,
        newAbsent: examMarkCorrections.newAbsent,
        editedById: examMarkCorrections.editedById,
        editedByName: user.name,
        editedByRole: examMarkCorrections.editedByRole,
        approvedByName: approvedBy.name,
        reason: examMarkCorrections.reason,
      })
      .from(examMarkCorrections)
      .innerJoin(
        enrollments,
        eq(enrollments.id, examMarkCorrections.enrollmentId),
      )
      .innerJoin(student, eq(student.id, enrollments.studentId))
      .innerJoin(
        examMarkTypesDrizzle,
        eq(examMarkTypesDrizzle.id, examMarkCorrections.markTypeId),
      )
      .innerJoin(user, eq(user.id, examMarkCorrections.editedById))
      .leftJoin(approvedBy, eq(approvedBy.id, examMarkCorrections.approvedById))
      .where(
        and(
          eq(examMarkCorrections.instituteId, instituteId),
          eq(examMarkCorrections.examId, examId),
          eq(examMarkCorrections.subjectId, subjectId),
          // scope to this section so nothing leaks across sections
          eq(enrollments.sectionId, sectionId),
        ),
      )
      .orderBy(desc(examMarkCorrections.createdAt));

    const list: OutputMarkCorrectionType[] = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      studentId: row.studentId,
      roll: row.roll,
      studentName: row.englishName || row.banglaName || "",
      markTypeName: row.markTypeName,
      oldMark: row.oldMark,
      newMark: row.newMark,
      oldAbsent: row.oldAbsent,
      newAbsent: row.newAbsent,
      editedById: row.editedById,
      editedByName: row.editedByName,
      editedByRole: row.editedByRole,
      approvedByName: row.approvedByName,
      reason: row.reason,
    }));

    return { success: true as const, data: list, details: {} };
  } catch (error) {
    console.error("Failed to load mark corrections:", error);
    return {
      success: false,
      error: "Failed to load correction history",
      details: {},
    };
  }
}
