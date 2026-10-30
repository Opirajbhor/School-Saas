"use server";

import { db } from "@/src/drizzle-DB";
import {
  enrollments,
  exams,
  subjectAssignSchema,
} from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { examIdZod, sortAssignedClasses } from "../_schema/exam.zod";

export async function getSingleExamData(id: string) {
  const parsed = parseWithZod(examIdZod, id);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }

  // resolved once so the counts below can scope on the same caller institute
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { instituteId } = ctx;

  const result = await readMany({
    drizzleSchema: exams,
    query: ({ db, instituteId }) =>
      db.query.exams.findMany({
        // the requested exam AND the caller's scope — global defaults included
        where: and(
          eq(exams.id, parsed.data),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
        with: {
          assignClasses: {
            with: {
              class: {
                with: {
                  sections: true,
                },
              },
            },
          },
        },
      }),
  });

  if (!result.success) {
    return result;
  }

  // the overview shows a subject and a student count per class, but neither is
  // reachable through the exam->class relation: a class has no `subjects` or
  // `students` relation. Subjects reach a class through subject_assignments,
  // and students through enrollments. Both are counted here, per class, in one
  // query each instead of loading every subject and student row.
  const examsRows = result.data as {
    sessionId: string | null;
    assignClasses: {
      classId: string;
      status: string;
      class: {
        id: string;
        name: string;
        sections: unknown[];
        subjects: unknown[];
        students: unknown[];
      };
    }[];
  }[];
  // the where clause pins the exam id, so there is at most one row
  const currentExam = examsRows[0];

  // exam_classes has no meaningful order of its own, so the cards are put into
  // academic order here
  if (currentExam) {
    currentExam.assignClasses = sortAssignedClasses(currentExam.assignClasses);
  }

  const classIds = (currentExam?.assignClasses ?? []).map((row) => row.classId);

  if (classIds.length > 0) {
    const subjectCounts = await getSubjectCounts(classIds, instituteId);
    const studentCounts = await getStudentCounts(classIds, instituteId);

    for (const row of currentExam.assignClasses) {
      // the overview only reads `.length` on both, so a placeholder array of
      // the right size carries the count without fabricating rows
      row.class.subjects = asCount(subjectCounts.get(row.classId) ?? 0);
      row.class.students = asCount(studentCounts.get(row.classId) ?? 0);
    }
  }

  return result;
}

// a class's subjects live in subject_assignments, not on the class itself.
// grouped by class so the whole page costs one query.
async function getSubjectCounts(classIds: string[], instituteId: string) {
  const rows = await db
    .select({
      classId: subjectAssignSchema.classId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(subjectAssignSchema)
    .where(
      and(
        inArray(subjectAssignSchema.classId, classIds),
        eq(subjectAssignSchema.status, "ACTIVE"),
        or(
          isNull(subjectAssignSchema.instituteId),
          eq(subjectAssignSchema.instituteId, instituteId),
        ),
      ),
    )
    .groupBy(subjectAssignSchema.classId);

  return new Map(rows.map((row) => [row.classId, row.count]));
}

// students reach a class through enrollments. this deliberately mirrors
// getSectionStudents in markInput.action.ts — institute + ACTIVE, and no
// session filter — so the count shown here matches the rows mark entry loads.
// exams.sessionId is nullable for pre-existing rows, so scoping on it would
// zero out every count.
async function getStudentCounts(classIds: string[], instituteId: string) {
  const rows = await db
    .select({
      classId: enrollments.classId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(enrollments)
    .where(
      and(
        inArray(enrollments.classId, classIds),
        eq(enrollments.instituteId, instituteId),
        eq(enrollments.status, "ACTIVE"),
      ),
    )
    .groupBy(enrollments.classId);

  return new Map(rows.map((row) => [row.classId, row.count]));
}

function asCount(count: number): unknown[] {
  return Array.from({ length: count }, () => ({}));
}
