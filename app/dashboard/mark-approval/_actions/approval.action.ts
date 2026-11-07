"use server";

/**
 * Institute approval of teacher mark submissions.
 *
 * A submission is one (exam, class, section, subject) sheet. The teacher's
 * SUBMITTED save creates it as PENDING; the institute approves (locked) or
 * rejects it with a mandatory reason, which lets the teacher edit and resubmit.
 * Approving refuses to sign off a sheet whose class roster changed since it was
 * submitted — `roster_hash` is captured at submit time.
 */

import { and, asc, desc, eq, gte, ilike, inArray, lte, or, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import z from "zod";

import { submissionFilterZod, type InputSubmissionFilter } from "../_schema/approval.zod";

import { db } from "@/src/drizzle-DB";
import {
  classesDrizzle,
  enrollments,
  examMarkTypesDrizzle,
  examMarks,
  exams,
  markSubmissionEvents,
  markSubmissions,
  sectionDrizzle,
  student,
  subjectDbSchema,
  subjectMarkTemplates,
  teachers,
} from "@/src/drizzle-DB/schema";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import {
  actorName,
  hashOf,
  rosterFor,
  rosterHashes,
} from "../_lib/mark-submission.internal";
import { notifyUsers } from "@/src/server-actions/shared/notification.internal";

const FAILED = {
  success: false as const,
  error: "Something went wrong. Please try again.",
  details: {},
} as const;

async function requireInstituteAdmin() {
  // getUserContext applies the inactive-institute gate that the raw session
  // lookup skips — a suspended institute must lose these features too
  const ctx = await getUserContext();
  if (!ctx?.instituteId) {
    return { success: false as const, error: "Not authorized", details: {} };
  }
  if (ctx.role !== "admin") {
    return {
      success: false as const,
      error: "Only the institute can approve marks",
      details: {},
    };
  }
  return { success: true as const, data: ctx };
}

// ------- filters (schema lives outside: this file may only export actions)

export async function listMarkSubmissions(filters: InputSubmissionFilter) {
  const auth = await requireInstituteAdmin();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const parsed = submissionFilterZod.safeParse(filters);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid filters", details: {} };
  }
  const f = parsed.data;

  try {
    const conditions = [eq(markSubmissions.instituteId, instituteId)];

    if (f.examId) conditions.push(eq(markSubmissions.examId, f.examId));
    if (f.classId) conditions.push(eq(markSubmissions.classId, f.classId));
    if (f.subjectId) conditions.push(eq(markSubmissions.subjectId, f.subjectId));
    if (f.teacherId) conditions.push(eq(markSubmissions.teacherId, f.teacherId));
    if (f.status !== "ALL") conditions.push(eq(markSubmissions.status, f.status));
    if (f.from) conditions.push(gte(markSubmissions.submittedAt, new Date(f.from)));
    if (f.to) {
      const to = new Date(f.to);
      to.setHours(23, 59, 59, 999);
      conditions.push(lte(markSubmissions.submittedAt, to));
    }
    if (f.q) {
      const search = or(
        ilike(subjectDbSchema.name, `%${f.q}%`),
        ilike(markSubmissions.teacherName, `%${f.q}%`),
        ilike(exams.name, `%${f.q}%`),
        ilike(sectionDrizzle.name, `%${f.q}%`),
      );
      if (search) conditions.push(search);
    }

    const where = and(...conditions);

    const sortColumn =
      f.sort === "exam"
        ? exams.name
        : f.sort === "section"
          ? sectionDrizzle.name
          : f.sort === "subject"
            ? subjectDbSchema.name
            : f.sort === "status"
              ? markSubmissions.status
              : f.sort === "count"
                ? markSubmissions.resubmissionCount
                : markSubmissions.submittedAt;

    const order = f.dir === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (f.page - 1) * f.perPage;

    const [rows, countRows, pending] = await Promise.all([
      db
        .select({
          id: markSubmissions.id,
          examId: markSubmissions.examId,
          examName: exams.name,
          classId: markSubmissions.classId,
          className: classesDrizzle.name,
          sectionId: markSubmissions.sectionId,
          sectionName: sectionDrizzle.name,
          subjectId: markSubmissions.subjectId,
          subjectName: subjectDbSchema.name,
          teacherId: markSubmissions.teacherId,
          teacherName: markSubmissions.teacherName,
          status: markSubmissions.status,
          resubmissionCount: markSubmissions.resubmissionCount,
          studentCount: markSubmissions.studentCount,
          submittedAt: markSubmissions.submittedAt,
          decidedAt: markSubmissions.decidedAt,
          decisionNote: markSubmissions.decisionNote,
          rosterHash: markSubmissions.rosterHash,
        })
        .from(markSubmissions)
        .innerJoin(exams, eq(exams.id, markSubmissions.examId))
        .innerJoin(classesDrizzle, eq(classesDrizzle.id, markSubmissions.classId))
        .innerJoin(
          sectionDrizzle,
          eq(sectionDrizzle.id, markSubmissions.sectionId),
        )
        .innerJoin(
          subjectDbSchema,
          eq(subjectDbSchema.id, markSubmissions.subjectId),
        )
        .where(where)
        .orderBy(order)
        .limit(f.perPage)
        .offset(offset),
      db
        .select({ count: count() })
        .from(markSubmissions)
        .innerJoin(exams, eq(exams.id, markSubmissions.examId))
        .innerJoin(
          sectionDrizzle,
          eq(sectionDrizzle.id, markSubmissions.sectionId),
        )
        .innerJoin(
          subjectDbSchema,
          eq(subjectDbSchema.id, markSubmissions.subjectId),
        )
        .where(where),
      db
        .select({ count: count() })
        .from(markSubmissions)
        .where(
          and(
            eq(markSubmissions.instituteId, instituteId),
            eq(markSubmissions.status, "PENDING"),
          ),
        ),
    ]);

    // mark rows whose class list moved since submission
    const sections = [...new Set(rows.map((row) => row.sectionId))];
    const rosters = await rosterHashes(sections, instituteId);

    const total = countRows[0]?.count ?? 0;

    return {
      success: true as const,
      data: {
        items: rows.map((row) => ({
          ...row,
          rosterChanged: row.rosterHash !== rosters.get(row.sectionId),
        })),
        total,
        pending: pending[0]?.count ?? 0,
        page: f.page,
        pages: Math.max(1, Math.ceil(total / f.perPage)),
      },
    };
  } catch (error) {
    console.error("listMarkSubmissions failed:", error);
    return FAILED;
  }
}

/** Count for the sidebar badge. */
export async function getPendingMarkSubmissionCount() {
  const ctx = await getUserContext();
  if (!ctx?.instituteId || ctx.role !== "admin") return 0;

  try {
    const [row] = await db
      .select({ count: count() })
      .from(markSubmissions)
      .where(
        and(
          eq(markSubmissions.instituteId, ctx.instituteId),
          eq(markSubmissions.status, "PENDING"),
        ),
      );
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

/** Dropdown options: exams/classes/subjects/teachers that have submissions. */
export async function getApprovalFilterOptions() {
  const auth = await requireInstituteAdmin();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  try {
    const [examRows, classRows, subjectRows, teacherRows] = await Promise.all([
      db
        .selectDistinct({ id: exams.id, name: exams.name })
        .from(markSubmissions)
        .innerJoin(exams, eq(exams.id, markSubmissions.examId))
        .where(eq(markSubmissions.instituteId, instituteId)),
      db
        .selectDistinct({ id: classesDrizzle.id, name: classesDrizzle.name })
        .from(markSubmissions)
        .innerJoin(classesDrizzle, eq(classesDrizzle.id, markSubmissions.classId))
        .where(eq(markSubmissions.instituteId, instituteId)),
      db
        .selectDistinct({
          id: subjectDbSchema.id,
          name: subjectDbSchema.name,
        })
        .from(markSubmissions)
        .innerJoin(
          subjectDbSchema,
          eq(subjectDbSchema.id, markSubmissions.subjectId),
        )
        .where(eq(markSubmissions.instituteId, instituteId)),
      db
        .selectDistinct({
          id: teachers.id,
          name: teachers.nameEnglish,
        })
        .from(markSubmissions)
        .innerJoin(teachers, eq(teachers.id, markSubmissions.teacherId))
        .where(eq(markSubmissions.instituteId, instituteId)),
    ]);

    return {
      success: true as const,
      data: {
        exams: examRows.sort((a, b) => a.name.localeCompare(b.name)),
        classes: classRows.sort((a, b) => a.name.localeCompare(b.name)),
        subjects: subjectRows.sort((a, b) => a.name.localeCompare(b.name)),
        teachers: teacherRows.sort((a, b) => a.name.localeCompare(b.name)),
      },
    };
  } catch (error) {
    console.error("getApprovalFilterOptions failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- detail
export async function getMarkSubmissionDetail(id: string) {
  const auth = await requireInstituteAdmin();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  try {
    const [submission] = await db
      .select({
        id: markSubmissions.id,
        examName: exams.name,
        examId: markSubmissions.examId,
        className: classesDrizzle.name,
        sectionId: markSubmissions.sectionId,
        sectionName: sectionDrizzle.name,
        subjectName: subjectDbSchema.name,
        subjectId: markSubmissions.subjectId,
        teacherName: markSubmissions.teacherName,
        teacherNote: markSubmissions.teacherNote,
        status: markSubmissions.status,
        resubmissionCount: markSubmissions.resubmissionCount,
        studentCount: markSubmissions.studentCount,
        rosterHash: markSubmissions.rosterHash,
        submittedAt: markSubmissions.submittedAt,
        decidedAt: markSubmissions.decidedAt,
        decidedByName: markSubmissions.decidedByName,
        decisionNote: markSubmissions.decisionNote,
      })
      .from(markSubmissions)
      .innerJoin(exams, eq(exams.id, markSubmissions.examId))
      .innerJoin(classesDrizzle, eq(classesDrizzle.id, markSubmissions.classId))
      .innerJoin(
        sectionDrizzle,
        eq(sectionDrizzle.id, markSubmissions.sectionId),
      )
      .innerJoin(subjectDbSchema, eq(subjectDbSchema.id, markSubmissions.subjectId))
      .where(
        and(
          eq(markSubmissions.id, id),
          eq(markSubmissions.instituteId, instituteId),
        ),
      )
      .limit(1);

    if (!submission) {
      return { success: false as const, error: "Submission not found", details: {} };
    }

    const [marks, markTypes, events, rosterNow] = await Promise.all([
      db
        .select({
          enrollmentId: examMarks.enrollmentId,
          markTypeId: examMarks.markTypeId,
          mark: examMarks.mark,
          absent: examMarks.absent,
          status: examMarks.status,
        })
        .from(examMarks)
        .where(
          and(
            eq(examMarks.instituteId, instituteId),
            eq(examMarks.examId, submission.examId),
            eq(examMarks.subjectId, submission.subjectId),
            eq(examMarks.status, "ACTIVE"),
          ),
        ),
      db
        .select({
          id: examMarkTypesDrizzle.id,
          name: examMarkTypesDrizzle.name,
          fullMark: subjectMarkTemplates.fullMark,
        })
        .from(examMarkTypesDrizzle)
        .leftJoin(
          subjectMarkTemplates,
          and(
            eq(subjectMarkTemplates.markTypeId, examMarkTypesDrizzle.id),
            eq(subjectMarkTemplates.subjectId, submission.subjectId),
          ),
        )
        .where(eq(examMarkTypesDrizzle.status, "ACTIVE"))
        .orderBy(asc(examMarkTypesDrizzle.name)),
      db
        .select({
          id: markSubmissionEvents.id,
          action: markSubmissionEvents.action,
          actorName: markSubmissionEvents.actorName,
          actorRole: markSubmissionEvents.actorRole,
          note: markSubmissionEvents.note,
          createdAt: markSubmissionEvents.createdAt,
        })
        .from(markSubmissionEvents)
        .where(eq(markSubmissionEvents.submissionId, id))
        .orderBy(desc(markSubmissionEvents.createdAt)),
      db
        .select({
          enrollmentId: enrollments.id,
          roll: enrollments.roll,
          name: student.englishName,
        })
        .from(enrollments)
        .innerJoin(student, eq(student.id, enrollments.studentId))
        .where(
          and(
            eq(enrollments.sectionId, submission.sectionId),
            eq(enrollments.instituteId, instituteId),
            eq(enrollments.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(enrollments.roll)),
    ]);

    // only types this subject actually marks (the join is a left join, so a
    // type with no template and no marks would otherwise show an empty column)
    const usedTypes = markTypes.filter(
      (type) =>
        type.fullMark != null ||
        marks.some((row) => row.markTypeId === type.id),
    );

    const byEnrollment = new Map<string, Map<string, { mark: number; absent: boolean }>>();
    for (const row of marks) {
      if (!byEnrollment.has(row.enrollmentId)) {
        byEnrollment.set(row.enrollmentId, new Map());
      }
      byEnrollment.get(row.enrollmentId)!.set(row.markTypeId, {
        mark: row.mark,
        absent: row.absent,
      });
    }

    const rosterChanged =
      submission.rosterHash !== hashOf(rosterNow.map((row) => row.enrollmentId));

    return {
      success: true as const,
      data: {
        submission: { ...submission, rosterChanged },
        markTypes: usedTypes,
        students: rosterNow.map((row) => ({
          enrollmentId: row.enrollmentId,
          roll: row.roll,
          name: row.name,
          marks: usedTypes.map((type) => {
            const cell = byEnrollment.get(row.enrollmentId)?.get(type.id);
            return {
              markTypeId: type.id,
              markTypeName: type.name,
              fullMark: type.fullMark,
              mark: cell?.mark ?? null,
              absent: cell?.absent ?? false,
            };
          }),
        })),
        events,
      },
    };
  } catch (error) {
    console.error("getMarkSubmissionDetail failed:", error);
    return FAILED;
  }
}

// ---------------------------------------------------------------- decisions
const idsZod = z.array(z.uuid()).min(1).max(100);
const rejectZod = z.object({
  ids: idsZod,
  reason: z
    .string()
    .trim()
    .min(10, { error: "Give a reason of at least 10 characters" })
    .max(600),
});

/**
 * Approve: one transaction per submission. It re-reads the roster, requires
 * every submitted mark to still exist, then flips the status — so a sheet can
 * never be marked approved while its marks are missing or its class list moved.
 */
export async function approveMarkSubmissions(ids: string[]) {
  const auth = await requireInstituteAdmin();
  if (!auth.success) return auth;
  const { instituteId, userId, role } = auth.data;

  const parsed = idsZod.safeParse(ids);
  if (!parsed.success) {
    return { success: false as const, error: "Nothing selected", details: {} };
  }

  const approverName = await actorName(userId);
  const approved: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const id of parsed.data) {
    try {
      await db.transaction(async (tx) => {
        const [submission] = await tx
          .select()
          .from(markSubmissions)
          .where(
            and(
              eq(markSubmissions.id, id),
              eq(markSubmissions.instituteId, instituteId),
            ),
          )
          .for("update")
          .limit(1);

        if (!submission) throw new Error("Submission not found");
        if (submission.status === "APPROVED") throw new Error("Already approved");
        if (submission.status === "REJECTED") {
          throw new Error("Rejected sheets must be resubmitted by the teacher");
        }

        const roster = await rosterFor(submission.sectionId, instituteId);
        if (hashOf(roster) !== submission.rosterHash) {
          throw new Error(
            "The class list changed after submission — reopen and ask for a resubmission",
          );
        }

        // every active mark row for this scope must still be there
        const [markRow] = await tx
          .select({ count: count() })
          .from(examMarks)
          .where(
            and(
              eq(examMarks.instituteId, instituteId),
              eq(examMarks.examId, submission.examId),
              eq(examMarks.subjectId, submission.subjectId),
              eq(examMarks.status, "ACTIVE"),
              inArray(examMarks.enrollmentId, roster),
            ),
          );

        if ((markRow?.count ?? 0) === 0) {
          throw new Error("No marks found for this sheet");
        }

        await tx
          .update(markSubmissions)
          .set({
            status: "APPROVED",
            decidedById: userId,
            decidedByName: approverName,
            decidedAt: new Date(),
            decisionNote: null,
            updatedAt: new Date(),
          })
          .where(eq(markSubmissions.id, id));

        await tx.insert(markSubmissionEvents).values({
          submissionId: id,
          action: "APPROVE",
          actorId: userId,
          actorRole: role ?? "admin",
          actorName: approverName,
          note: null,
        });
      });

      approved.push(id);
    } catch (error) {
      failed.push({
        id,
        error: error instanceof Error ? error.message : "Approval failed",
      });
    }
  }

  if (approved.length > 0) {
    // tell the teacher who submitted it: their sheet is locked now
    const rows = await db
      .select({
        teacherUserId: teachers.userId,
        subject: subjectDbSchema.name,
      })
      .from(markSubmissions)
      .innerJoin(subjectDbSchema, eq(subjectDbSchema.id, markSubmissions.subjectId))
      .innerJoin(teachers, eq(teachers.id, markSubmissions.teacherId))
      .where(inArray(markSubmissions.id, approved));

    await notifyUsers({
      userIds: rows.map((row) => row.teacherUserId),
      type: "MARKS_APPROVED",
      title: `${approved.length} mark sheet${approved.length === 1 ? "" : "s"} approved`,
      body: rows.map((row) => row.subject).join(", ").slice(0, 160),
      href: "/dashboard/exam/mark-input",
    });
  }

  revalidatePath("/dashboard/mark-approval");
  revalidatePath("/dashboard/exam/mark-input");

  return {
    success: true as const,
    data: { approved: approved.length, failed },
  };
}

export async function rejectMarkSubmissions(ids: string[], reason: string) {
  const auth = await requireInstituteAdmin();
  if (!auth.success) return auth;
  const { instituteId, userId, role } = auth.data;

  const parsed = rejectZod.safeParse({ ids, reason });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "A reason is required",
      details: {},
    };
  }

  const rejecter = await actorName(userId);
  const rejected: string[] = [];

  for (const id of parsed.data.ids) {
    try {
      await db.transaction(async (tx) => {
        // lock first: without it a concurrent approve and reject both commit
        const [submission] = await tx
          .select({
            id: markSubmissions.id,
            status: markSubmissions.status,
            examId: markSubmissions.examId,
            sectionId: markSubmissions.sectionId,
            subjectId: markSubmissions.subjectId,
          })
          .from(markSubmissions)
          .where(
            and(
              eq(markSubmissions.id, id),
              eq(markSubmissions.instituteId, instituteId),
            ),
          )
          .for("update")
          .limit(1);

        if (!submission) throw new Error("Submission not found");
        if (submission.status !== "PENDING") {
          throw new Error("Only a pending sheet can be rejected");
        }

        await tx
          .update(markSubmissions)
          .set({
            status: "REJECTED",
            decidedById: userId,
            decidedByName: rejecter,
            decidedAt: new Date(),
            decisionNote: parsed.data.reason,
            updatedAt: new Date(),
          })
          .where(eq(markSubmissions.id, id));

        // hand the sheet back: the teacher's save is also gated on
        // exam_marks.entry_status, so a rejection that leaves it SUBMITTED
        // leaves the teacher unable to fix anything
        await tx
          .update(examMarks)
          .set({ entryStatus: "DRAFT", updatedAt: new Date() })
          .where(
            and(
              eq(examMarks.instituteId, instituteId),
              eq(examMarks.examId, submission.examId),
              eq(examMarks.subjectId, submission.subjectId),
              eq(examMarks.entryStatus, "SUBMITTED"),
              inArray(
                examMarks.enrollmentId,
                tx
                  .select({ id: enrollments.id })
                  .from(enrollments)
                  .where(eq(enrollments.sectionId, submission.sectionId)),
              ),
            ),
          );

        await tx.insert(markSubmissionEvents).values({
          submissionId: id,
          action: "REJECT",
          actorId: userId,
          actorRole: role ?? "admin",
          actorName: rejecter,
          note: parsed.data.reason,
        });
      });

      rejected.push(id);
    } catch (error) {
      console.error("rejectMarkSubmissions row failed:", error);
    }
  }

  revalidatePath("/dashboard/mark-approval");
  revalidatePath("/dashboard/exam/mark-input");
  return { success: true as const, data: { rejected: rejected.length } };
}

/** Reopen an approved sheet so the teacher may edit again. */
export async function reopenMarkSubmissions(ids: string[]) {
  const auth = await requireInstituteAdmin();
  if (!auth.success) return auth;
  const { instituteId, userId, role } = auth.data;

  const parsed = idsZod.safeParse(ids);
  if (!parsed.success) {
    return { success: false as const, error: "Nothing selected", details: {} };
  }

  const reopenedBy = await actorName(userId);
  let reopened = 0;

  for (const id of parsed.data) {
    const [submission] = await db
      .select({ status: markSubmissions.status })
      .from(markSubmissions)
      .where(
        and(eq(markSubmissions.id, id), eq(markSubmissions.instituteId, instituteId)),
      )
      .limit(1);

    if (!submission || submission.status !== "APPROVED") continue;

    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({
          examId: markSubmissions.examId,
          sectionId: markSubmissions.sectionId,
          subjectId: markSubmissions.subjectId,
          status: markSubmissions.status,
        })
        .from(markSubmissions)
        .where(eq(markSubmissions.id, id))
        .for("update")
        .limit(1);

      if (!locked || locked.status !== "APPROVED") return;

      await tx
        .update(markSubmissions)
        .set({
          status: "REOPENED",
          decidedById: userId,
          decidedByName: reopenedBy,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(markSubmissions.id, id));

      // approved marks are frozen only until the institute reopens them
      await tx
        .update(examMarks)
        .set({ entryStatus: "DRAFT", updatedAt: new Date() })
        .where(
          and(
            eq(examMarks.instituteId, instituteId),
            eq(examMarks.examId, locked.examId),
            eq(examMarks.subjectId, locked.subjectId),
            eq(examMarks.entryStatus, "SUBMITTED"),
            inArray(
              examMarks.enrollmentId,
              tx
                .select({ id: enrollments.id })
                .from(enrollments)
                .where(eq(enrollments.sectionId, locked.sectionId)),
            ),
          ),
        );

      await tx.insert(markSubmissionEvents).values({
        submissionId: id,
        action: "REOPEN",
        actorId: userId,
        actorRole: role ?? "admin",
        actorName: reopenedBy,
        note: "Reopened for edits",
      });
    });

    reopened += 1;
  }

  revalidatePath("/dashboard/mark-approval");
  revalidatePath("/dashboard/exam/mark-input");
  return { success: true as const, data: { reopened } };
}

