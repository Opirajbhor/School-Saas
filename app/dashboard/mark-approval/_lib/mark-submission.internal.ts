// Server-only mark-submission helpers.
//
// These live OUTSIDE the "use server" action module on purpose: every export of
// an action module is a public RPC endpoint, and these take the institute, user
// and role as arguments. Exposed, they would let an unauthenticated caller
// plant PENDING rows in another tenant's approval queue, wipe a recorded
// approver, or forge the audit trail.

import { createHash } from "crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import {
  enrollments,
  markSubmissionEvents,
  markSubmissions,
  teachers,
} from "@/src/drizzle-DB/schema";

export const hashOf = (ids: string[]) =>
  createHash("sha1").update(ids.join("|")).digest("hex");

/** Sorted, active enrolment ids — the fingerprint of the class list. */
export async function rosterFor(sectionId: string, instituteId: string) {
  const rows = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.sectionId, sectionId),
        eq(enrollments.instituteId, instituteId),
        eq(enrollments.status, "ACTIVE"),
      ),
    )
    .orderBy(asc(enrollments.id));

  return rows.map((row) => row.id);
}

/**
 * Roster hash for many sections in one query — the approval table needs one per
 * distinct section, and the Neon pooler makes a per-section round trip costly.
 */
export async function rosterHashes(sectionIds: string[], instituteId: string) {
  const map = new Map<string, string>();
  if (sectionIds.length === 0) return map;

  const rows = await db
    .select({ sectionId: enrollments.sectionId, id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        inArray(enrollments.sectionId, sectionIds),
        eq(enrollments.instituteId, instituteId),
        eq(enrollments.status, "ACTIVE"),
      ),
    )
    .orderBy(asc(enrollments.id));

  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const list = grouped.get(row.sectionId) ?? [];
    list.push(row.id);
    grouped.set(row.sectionId, list);
  }

  for (const sectionId of sectionIds) {
    map.set(sectionId, hashOf(grouped.get(sectionId) ?? []));
  }
  return map;
}

export async function actorName(userId: string) {
  const [row] = await db
    .select({ name: teachers.nameEnglish })
    .from(teachers)
    .where(eq(teachers.userId, userId))
    .limit(1);
  return row?.name ?? null;
}

/**
 * Called by the teacher's save before writing anything. Blocks a resubmission
 * while the institute is holding the sheet, and blocks edits after approval
 * until it is reopened.
 */
export async function assertMarkSubmissionAllowed(input: {
  examId: string;
  sectionId: string;
  subjectId: string;
  instituteId: string;
}) {
  const [submission] = await db
    .select({ status: markSubmissions.status })
    .from(markSubmissions)
    .where(
      and(
        eq(markSubmissions.instituteId, input.instituteId),
        eq(markSubmissions.examId, input.examId),
        eq(markSubmissions.sectionId, input.sectionId),
        eq(markSubmissions.subjectId, input.subjectId),
      ),
    )
    .limit(1);

  if (!submission) return { allowed: true as const, status: null };

  if (submission.status === "PENDING") {
    return {
      allowed: false as const,
      status: submission.status,
      error: "This sheet is waiting for the institute's approval",
    };
  }
  if (submission.status === "APPROVED") {
    return {
      allowed: false as const,
      status: submission.status,
      error:
        "The institute approved these marks. Ask them to reopen the sheet before editing.",
    };
  }

  return { allowed: true as const, status: submission.status };
}

/**
 * Upsert the submission after a SUBMITTED save.
 *
 * Runs in one transaction with the row locked so a concurrent approval cannot
 * be reverted (the approval wins), and so two first-time submits cannot collide
 * on the unique scope key.
 */
export async function recordMarkSubmission(input: {
  instituteId: string;
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  userId: string;
  role: string;
  note?: string | null;
}) {
  const [teacherRow] = await db
    .select({ id: teachers.id, name: teachers.nameEnglish })
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, input.userId),
        eq(teachers.instituteId, input.instituteId),
      ),
    )
    .limit(1);

  const teacherId = teacherRow?.id ?? null;
  const teacherName = teacherRow?.name ?? null;

  const roster = await rosterFor(input.sectionId, input.instituteId);
  const rosterHash = hashOf(roster);
  const now = new Date();

  const scope = and(
    eq(markSubmissions.instituteId, input.instituteId),
    eq(markSubmissions.examId, input.examId),
    eq(markSubmissions.sectionId, input.sectionId),
    eq(markSubmissions.subjectId, input.subjectId),
  );

  return db.transaction(async (tx) => {
    let [existing] = await tx
      .select({
        id: markSubmissions.id,
        status: markSubmissions.status,
        resubmissionCount: markSubmissions.resubmissionCount,
      })
      .from(markSubmissions)
      .where(scope)
      .for("update")
      .limit(1);

    if (!existing) {
      const [created] = await tx
        .insert(markSubmissions)
        .values({
          instituteId: input.instituteId,
          examId: input.examId,
          classId: input.classId,
          sectionId: input.sectionId,
          subjectId: input.subjectId,
          teacherId,
          teacherName: teacherName ?? "Institute admin",
          status: "PENDING",
          studentCount: roster.length,
          rosterHash,
          teacherNote: input.note ?? null,
          submittedById: input.userId,
          submittedAt: now,
        })
        .onConflictDoNothing({
          target: [
            markSubmissions.instituteId,
            markSubmissions.examId,
            markSubmissions.sectionId,
            markSubmissions.subjectId,
          ],
        })
        .returning({ id: markSubmissions.id });

      if (created) {
        await tx.insert(markSubmissionEvents).values({
          submissionId: created.id,
          action: "SUBMIT",
          actorId: input.userId,
          actorRole: input.role,
          actorName: teacherName ?? "Institute admin",
          note: null,
        });
        return created.id;
      }

      // lost the insert race: fall through and treat it as a resubmission
      [existing] = await tx
        .select({
          id: markSubmissions.id,
          status: markSubmissions.status,
          resubmissionCount: markSubmissions.resubmissionCount,
        })
        .from(markSubmissions)
        .where(scope)
        .for("update")
        .limit(1);
      if (!existing) return null;
    }

    // an approval that landed during the save must never be reverted, and a
    // sheet already waiting for review must not be reset either
    if (existing.status === "APPROVED" || existing.status === "PENDING") {
      return existing.id;
    }

    await tx
      .update(markSubmissions)
      .set({
        status: "PENDING",
        resubmissionCount: sql`${markSubmissions.resubmissionCount} + 1`,
        studentCount: roster.length,
        rosterHash,
        teacherNote: input.note ?? null,
        teacherId,
        teacherName: teacherName ?? "Institute admin",
        submittedById: input.userId,
        submittedAt: now,
        decidedAt: null,
        decidedById: null,
        decidedByName: null,
        decisionNote: null,
        updatedAt: now,
      })
      .where(eq(markSubmissions.id, existing.id));

    await tx.insert(markSubmissionEvents).values({
      submissionId: existing.id,
      action: "RESUBMIT",
      actorId: input.userId,
      actorRole: input.role,
      actorName: teacherName ?? "Institute admin",
      note: null,
    });

    return existing.id;
  });
}
