"use server";

/**
 * Admit cards — one batch per exam + class (+ section), two cards per A4 page.
 *
 * Everything on the card is read from the database: the student and their
 * enrolment, the institute header, the class teacher of that section, the head
 * teacher's signature, and the routine for the student's own class. Nothing is
 * passed in from the browser except the ids, which are scope-checked.
 */

import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import {
  academicSessions,
  classesDrizzle,
  enrollments,
  examRoutineNotices,
  examRoutines,
  exams,
  groups,
  instituteProfile,
  sectionClassTeachers,
  sectionDrizzle,
  student,
  subjectDbSchema,
  teachers,
} from "@/src/drizzle-DB/schema";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FAILED = {
  success: false as const,
  error: "Something went wrong. Please try again.",
  details: {},
} as const;

export type AdmitCardRoutineRow = {
  examDate: string;
  subjectName: string;
  startsAt: string;
  endsAt: string;
  kind: "THEORY" | "PRACTICAL";
};

export type AdmitCardStudent = {
  enrollmentId: string;
  studentCode: string;
  englishName: string;
  banglaName: string | null;
  fatherName: string;
  motherName: string;
  photoUrl: string | null;
  roll: string;
  className: string;
  sectionName: string;
  groupName: string | null;
  sessionYear: string;
  dateOfBirth: string;
};

export type AdmitCardBatch = {
  institute: {
    nameEnglish: string;
    nameBangla: string;
    eiin: string;
    logo: string | null;
    signature: string | null;
    upazila: string;
    district: string;
  };
  exam: { id: string; name: string; sessionYear: string | null };
  klass: { id: string; name: string };
  section: { id: string; name: string } | null;
  notice: string;
  routine: AdmitCardRoutineRow[];
  students: AdmitCardStudent[];
  classTeacher: string | null;
};

const toHhMm = (value: string) => value.slice(0, 5);

async function requireAdmin() {
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

/** What the pickers on the page offer: exams, their classes, and sections. */
export async function getAdmitCardOptions() {
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  try {
    const [examRows, classRows, sectionRows] = await Promise.all([
      db
        .select({ id: exams.id, name: exams.name })
        .from(exams)
        .where(
          and(
            eq(exams.status, "ACTIVE"),
            or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
          ),
        )
        .orderBy(asc(exams.name)),
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
          id: sectionDrizzle.id,
          name: sectionDrizzle.name,
          classId: sectionDrizzle.classId,
        })
        .from(sectionDrizzle)
        .where(
          and(
            eq(sectionDrizzle.status, "ACTIVE"),
            eq(sectionDrizzle.instituteId, instituteId),
          ),
        )
        .orderBy(asc(sectionDrizzle.name)),
    ]);

    return {
      success: true as const,
      data: { exams: examRows, classes: classRows, sections: sectionRows },
    };
  } catch (error) {
    console.error("getAdmitCardOptions failed:", error);
    return FAILED;
  }
}

/** The batch itself: institute header, routine, class teacher and students. */
export async function getAdmitCards(input: {
  examId: string;
  classId: string;
  sectionId?: string | null;
}) {
  const auth = await requireAdmin();
  if (!auth.success) return auth;
  const { instituteId } = auth.data;

  const { examId, classId, sectionId } = input;
  if (!UUID_RE.test(examId) || !UUID_RE.test(classId)) {
    return { success: false as const, error: "Invalid exam or class", details: {} };
  }
  const section =
    sectionId && UUID_RE.test(sectionId) ? sectionId : (null as string | null);

  try {
    // the exam must be reachable from this institute
    const [examRow] = await db
      .select({
        id: exams.id,
        name: exams.name,
        sessionId: exams.sessionId,
      })
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

    const [classRow] = await db
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
      .limit(1);

    if (!classRow) {
      return { success: false as const, error: "Class not found", details: {} };
    }

    // students come from the enrolment for the exam's session, so a card always
    // matches the class list that sat that exam
    const studentScope = and(
      eq(enrollments.instituteId, instituteId),
      eq(enrollments.classId, classId),
      eq(enrollments.status, "ACTIVE"),
      examRow.sessionId ? eq(enrollments.sessionId, examRow.sessionId) : undefined,
      section ? eq(enrollments.sectionId, section) : undefined,
    );

    const [studentRows, routineRows, instituteRow, noticeRow, teacherRow] =
      await Promise.all([
        db
          .select({
            enrollmentId: enrollments.id,
            roll: enrollments.roll,
            studentCode: student.studentId,
            englishName: student.englishName,
            banglaName: student.banglaName,
            fatherName: student.fatherName,
            motherName: student.motherName,
            photoUrl: student.photoUrl,
            dateOfBirth: student.dateOfBirth,
            className: classesDrizzle.name,
            sectionName: sectionDrizzle.name,
            groupName: groups.name,
            sessionYear: academicSessions.year,
          })
          .from(enrollments)
          .innerJoin(student, eq(student.id, enrollments.studentId))
          .innerJoin(classesDrizzle, eq(classesDrizzle.id, enrollments.classId))
          .innerJoin(
            sectionDrizzle,
            eq(sectionDrizzle.id, enrollments.sectionId),
          )
          .innerJoin(
            academicSessions,
            eq(academicSessions.id, enrollments.sessionId),
          )
          .leftJoin(groups, eq(groups.id, enrollments.groupId))
          .where(studentScope)
          // section first, then roll: an all-sections sheet reads A-1, A-2, B-1
          // instead of every section's roll 1 together. `length` keeps 2 before
          // 10 in a varchar roll without casting a value that may not be numeric.
          .orderBy(
            asc(sectionDrizzle.name),
            sql`length(${enrollments.roll})`,
            asc(enrollments.roll),
          ),

        db
          .select({
            examDate: examRoutines.examDate,
            subjectName: subjectDbSchema.name,
            startsAt: examRoutines.startsAt,
            endsAt: examRoutines.endsAt,
            kind: examRoutines.kind,
            sectionId: examRoutines.sectionId,
          })
          .from(examRoutines)
          .innerJoin(
            subjectDbSchema,
            eq(subjectDbSchema.id, examRoutines.subjectId),
          )
          .where(
            and(
              eq(examRoutines.examId, examId),
              eq(examRoutines.classId, classId),
              eq(examRoutines.instituteId, instituteId),
            ),
          )
          .orderBy(asc(examRoutines.examDate), asc(examRoutines.startsAt)),

        db
          .select({
            nameEnglish: instituteProfile.nameEnglish,
            nameBangla: instituteProfile.nameBangla,
            eiin: instituteProfile.eiin,
            logo: instituteProfile.logo,
            signature: instituteProfile.signature,
            upazila: instituteProfile.upazila,
            district: instituteProfile.district,
          })
          .from(instituteProfile)
          .where(eq(instituteProfile.id, instituteId))
          .limit(1),

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

        // class teacher of the section the cards are printed for
        section
          ? db
              .select({ name: teachers.nameEnglish })
              .from(sectionClassTeachers)
              .innerJoin(
                teachers,
                eq(teachers.id, sectionClassTeachers.teacherId),
              )
              .where(
                and(
                  eq(sectionClassTeachers.instituteId, instituteId),
                  eq(sectionClassTeachers.sectionId, section),
                  eq(sectionClassTeachers.status, "ACTIVE"),
                ),
              )
              .limit(1)
          : Promise.resolve([] as { name: string }[]),
      ]);

    const institute = instituteRow[0];
    if (!institute) {
      return {
        success: false as const,
        error: "Institute profile not found",
        details: {},
      };
    }

    const sectionRow = section
      ? (
          await db
            .select({ id: sectionDrizzle.id, name: sectionDrizzle.name })
            .from(sectionDrizzle)
            .where(
              and(
                eq(sectionDrizzle.id, section),
                eq(sectionDrizzle.instituteId, instituteId),
              ),
            )
            .limit(1)
        )[0] ?? null
      : null;

    return {
      success: true as const,
      data: {
        institute,
        exam: {
          id: examRow.id,
          name: examRow.name,
          sessionYear: studentRows[0]?.sessionYear ?? null,
        },
        klass: classRow,
        section: sectionRow,
        notice: noticeRow[0]?.notice ?? "",
        // a section-specific sitting (practical) is shown only to that section
        routine: routineRows
          .filter((row) => !row.sectionId || row.sectionId === section)
          .map((row) => ({
            examDate: row.examDate,
            subjectName: row.subjectName,
            startsAt: toHhMm(row.startsAt),
            endsAt: toHhMm(row.endsAt),
            kind: row.kind,
          })),
        students: studentRows.map((row) => ({
          ...row,
          dateOfBirth:
            row.dateOfBirth instanceof Date
              ? row.dateOfBirth.toISOString().slice(0, 10)
              : String(row.dateOfBirth),
        })),
        classTeacher: teacherRow[0]?.name ?? null,
      } satisfies AdmitCardBatch,
    };
  } catch (error) {
    console.error("getAdmitCards failed:", error);
    return FAILED;
  }
}
