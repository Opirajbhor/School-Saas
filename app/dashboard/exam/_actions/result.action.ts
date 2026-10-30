"use server";

import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { parseWithZod } from "@/src/validation/validator.zod";
import { db } from "@/src/drizzle-DB";
import {
  classesDrizzle,
  enrollments,
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  examMarks,
  examResultSnapshots,
  exams,
  sectionDrizzle,
  student,
  subjectAssignSchema,
  subjectDbSchema,
  subjectMarkTemplates,
} from "@/src/drizzle-DB/schema";
import {
  InputResultQueryType,
  InputResultSnapshotScopeType,
  OutputExamResultType,
  OutputResultSnapshotType,
  PublishReadinessType,
  resultQueryZod,
  resultSnapshotScopeZod,
} from "../_schema/exam.zod";
import {
  calculateResults,
  MarkCell,
  StudentRule,
  SubjectRule,
} from "../_lib/result-calculator";

/**
 * Calculates the result sheet for one exam and one class.
 *
 * Nothing is stored: the sheet is built from the marks as they stand, so it
 * always agrees with mark entry and follows the existing workflow lock. When
 * marks are missing the calculation still runs, but `complete` is false and the
 * missing units are listed so the page can warn before showing ranks.
 *
 * Once the exam is PUBLISHED the stored snapshot is returned instead, so the
 * numbers on screen stay exactly as they were published even if a mark was
 * corrected afterwards.
 */
export async function getExamResult(data: InputResultQueryType) {
  const parsed = parseWithZod(resultQueryZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, classId } = parsed.data;

  try {
    const exam = await getExamRow(examId);
    if (!exam) {
      return { success: false as const, error: "Exam not found", details: {} };
    }

    // published results are served frozen, from the snapshot
    if (exam.markWorkflow === "PUBLISHED") {
      const snapshot = await findLatestSnapshot(examId, classId);
      if (snapshot) {
        return {
          success: true as const,
          data: {
            ...snapshot.payload,
            fromSnapshot: true,
            snapshotVersion: snapshot.version,
          } satisfies OutputExamResultType,
        };
      }
      // published without a snapshot (older data) — fall through to a live
      // calculation so the page still works
    }

    const sheet = await buildExamResultSheet(examId, classId);
    return { success: true as const, data: sheet };
  } catch (error) {
    console.error("getExamResult failed:", error);
    return {
      success: false as const,
      error: "Failed to calculate results",
      details: {},
    };
  }
}

/**
 * Builds the result sheet from live marks. Shared by the results page and the
 * publish action so a published snapshot is byte-for-byte what was reviewed.
 *
 * Throws only on unexpected failures; a class with no students or no subjects
 * returns an empty but valid sheet.
 */
export async function buildExamResultSheet(
  examId: string,
  classId: string,
): Promise<OutputExamResultType> {
  const exam = await getExamRow(examId);
  if (!exam) throw new Error("Exam not found");

  const students = await getClassStudents(classId);
  const subjects = await getClassSubjects(classId);
  const scales = await getGradeScales();

  // no students or no subjects means there is nothing to calculate, which is
  // not an error — the page shows the empty state instead
  if (students.length === 0 || subjects.length === 0) {
    return {
      exam,
      class: await getClassRow(classId),
      subjects: [],
      students: [],
      sections: [],
      incomplete: [],
      complete: true,
    } satisfies OutputExamResultType;
  }

  const marks = await getMarks(examId, students.map((row) => row.enrollmentId));

  const calculated = calculateResults({
    scales,
    subjects,
    students,
    marks,
  });

  const sections = uniqueSections(students);

  return {
    exam,
    class: await getClassRow(classId),
    // the sheet's subject columns, in the order the students were graded
    subjects: resultColumns(calculated.students, subjects),
    students: calculated.students.map((row) => ({
      enrollmentId: row.enrollmentId,
      studentId: row.studentId,
      roll: row.roll,
      englishName: row.englishName,
      banglaName: row.banglaName,
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      subjects: row.subjects.map((subject) => ({
        subjectId: subject.subjectId,
        name: subject.name,
        obtained: subject.obtained,
        fullMark: subject.fullMark,
        percentage: subject.percentage,
        grade: subject.grade,
        GPA: subject.GPA,
        failed: subject.failed,
        absent: subject.absent,
      })),
      totalObtained: row.totalObtained,
      totalFullMark: row.totalFullMark,
      percentage: row.percentage,
      GPA: row.GPA,
      grade: row.grade,
      passed: row.passed,
      failedSubjects: row.failedSubjects,
      sectionRank: row.sectionRank,
      classRank: row.classRank,
    })),
    sections,
    incomplete: calculated.incomplete,
    complete: calculated.complete,
  };
}

// ---------------------------------------------------------------- snapshots

/**
 * Latest stored snapshot for one exam + class, or null when none was published.
 * `payload` is the frozen sheet written at publish time.
 */
export async function findLatestSnapshot(examId: string, classId: string) {
  const result = await readMany({
    drizzleSchema: examResultSnapshots,
    query: ({ db, instituteId }) =>
      db.query.examResultSnapshots.findMany({
        where: and(
          eq(examResultSnapshots.examId, examId),
          eq(examResultSnapshots.classId, classId),
          eq(examResultSnapshots.instituteId, instituteId),
          eq(examResultSnapshots.status, "ACTIVE"),
        ),
        orderBy: [desc(examResultSnapshots.version)],
        limit: 1,
      }),
  });

  if (!result.success) return null;
  const row = (result.data as OutputResultSnapshotType[])[0];
  return row ?? null;
}

/**
 * The snapshot a PUBLISHED class is showing, for the page badge. Returns null
 * when the exam is not published or has no snapshot yet.
 */
export async function getResultSnapshot(data: InputResultSnapshotScopeType) {
  const parsed = parseWithZod(resultSnapshotScopeZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }

  try {
    const snapshot = await findLatestSnapshot(
      parsed.data.examId,
      parsed.data.classId,
    );
    return { success: true as const, data: snapshot };
  } catch (error) {
    console.error("getResultSnapshot failed:", error);
    return {
      success: false as const,
      error: "Failed to load the published result",
      details: {},
    };
  }
}

/**
 * What an admin reviews before publishing: the live sheet plus anything that
 * looks wrong. Missing marks do not block publishing — they are reported, just
 * as they are when finalizing.
 */
export async function getPublishReadiness(
  data: InputResultSnapshotScopeType,
): Promise<
  | { success: true; data: PublishReadinessType; details: object }
  | { success: false; error: string; details: object }
> {
  const parsed = parseWithZod(resultSnapshotScopeZod, data);
  if (!parsed.success) {
    return { success: false, error: parsed.error, details: parsed.details };
  }

  try {
    const { examId, classId } = parsed.data;
    const preview = await buildExamResultSheet(examId, classId);

    // a student with nothing to grade usually means the subject assignment or
    // the enrollment is wrong, so it is worth flagging separately from missing
    // marks
    const problems: PublishReadinessType["problems"] = [];
    for (const row of preview.students) {
      if (row.subjects.length === 0) {
        problems.push({
          kind: "NO_SUBJECTS",
          studentId: row.studentId,
          studentName: row.englishName,
          roll: row.roll,
          detail: "No gradable subject is assigned to this student",
        });
        continue;
      }
      if (row.subjects.every((subject) => subject.absent)) {
        problems.push({
          kind: "NO_MARKS",
          studentId: row.studentId,
          studentName: row.englishName,
          roll: row.roll,
          detail: "Absent in every subject",
        });
      }
    }

    return {
      success: true,
      data: {
        ready: preview.complete && problems.length === 0,
        incomplete: preview.incomplete,
        problems,
        preview,
      },
      details: {},
    };
  } catch (error) {
    console.error("getPublishReadiness failed:", error);
    return {
      success: false,
      error: "Failed to prepare the result preview",
      details: {},
    };
  }
}

// ---------------------------------------------------------------- loaders

// the exam must belong to the caller's institute, or be a global default
async function getExamRow(examId: string) {
  const result = await readMany({
    drizzleSchema: exams,
    query: ({ db, instituteId }) =>
      db.query.exams.findMany({
        where: and(
          eq(exams.id, examId),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
        columns: { id: true, name: true, markWorkflow: true },
        limit: 1,
      }),
  });

  if (!result.success) return null;

  const row = (result.data as OutputExamResultType["exam"][])[0];
  return row ?? null;
}

async function getClassRow(classId: string) {
  const result = await readMany({
    drizzleSchema: classesDrizzle,
    query: ({ db, instituteId }) =>
      db.query.classesDrizzle.findMany({
        where: and(
          eq(classesDrizzle.id, classId),
          or(
            isNull(classesDrizzle.instituteId),
            eq(classesDrizzle.instituteId, instituteId),
          ),
        ),
        columns: { id: true, name: true },
        limit: 1,
      }),
  });

  const row = result.success
    ? (result.data as { id: string; name: string }[])[0]
    : undefined;
  return { id: row?.id ?? classId, name: row?.name ?? "" };
}

// students enrolled in any section of this class, ordered by roll.
// this mirrors getSectionStudents in markInput.action.ts — institute + ACTIVE,
// with no session filter — so the result sheet lists exactly the students whose
// marks were entered.
async function getClassStudents(classId: string): Promise<StudentRule[]> {
  const result = await readMany({
    drizzleSchema: enrollments,
    query: ({ db, instituteId }) =>
      db
        .select({
          enrollmentId: enrollments.id,
          studentId: enrollments.studentId,
          roll: enrollments.roll,
          englishName: student.englishName,
          banglaName: student.banglaName,
          sectionId: enrollments.sectionId,
          sectionName: sectionDrizzle.name,
          groupId: enrollments.groupId,
        })
        .from(enrollments)
        .innerJoin(student, eq(student.id, enrollments.studentId))
        .innerJoin(
          sectionDrizzle,
          eq(sectionDrizzle.id, enrollments.sectionId),
        )
        .where(
          and(
            eq(enrollments.instituteId, instituteId),
            eq(enrollments.classId, classId),
            eq(enrollments.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(sectionDrizzle.name), asc(enrollments.roll)),
  });

  return result.success ? (result.data as StudentRule[]) : [];
}

// subjects assigned to the class, with their mark types and combined pairs.
// a subject with no mark templates cannot be graded, so it is left out.
async function getClassSubjects(
  classId: string,
): Promise<SubjectRule[]> {
  const result = await readMany({
    drizzleSchema: subjectAssignSchema,
    query: ({ db, instituteId }) =>
      db
        .select({
          assignId: subjectAssignSchema.id,
          subjectId: subjectDbSchema.id,
          name: subjectDbSchema.name,
          subjectType: subjectAssignSchema.subject_type,
          isOptional: subjectAssignSchema.isOptional,
          isReligion: subjectAssignSchema.isReligion,
          groupId: subjectAssignSchema.groupId,
          combineWith: subjectDbSchema.combineWith,
          combineLabel: subjectDbSchema.combineLabel,
        })
        .from(subjectAssignSchema)
        .innerJoin(
          subjectDbSchema,
          eq(subjectDbSchema.id, subjectAssignSchema.subjectId),
        )
        .where(
          and(
            eq(subjectAssignSchema.classId, classId),
            eq(subjectAssignSchema.status, "ACTIVE"),
            eq(subjectDbSchema.status, "ACTIVE"),
            or(
              isNull(subjectAssignSchema.instituteId),
              eq(subjectAssignSchema.instituteId, instituteId),
            ),
            or(
              isNull(subjectDbSchema.instituteId),
              eq(subjectDbSchema.instituteId, instituteId),
            ),
          ),
        ),
    });

  const assignments = result.success
    ? (result.data as {
        assignId: string;
        subjectId: string;
        name: string;
        subjectType: string;
        isOptional: boolean;
        isReligion: boolean;
        groupId: string | null;
        combineWith: string | null;
        combineLabel: string | null;
      }[])
    : [];

  if (assignments.length === 0) return [];

  const subjectIds = assignments.map((row) => row.subjectId);
  const templates = await getMarkTemplates(subjectIds);

  // a group subject is a subject of one group; the pair anchor sits on the
  // assignment that is not itself combined, so both rows share the anchor id
  const anchorOf = (row: { subjectId: string; combineWith: string | null }) =>
    row.combineWith ?? row.subjectId;

  const rules: SubjectRule[] = assignments.map((row) => ({
    id: row.subjectId,
    name: row.name,
    subjectType: row.subjectType,
    isOptional: row.isOptional,
    isReligion: row.isReligion,
    groupId: row.groupId,
    // two papers combine under one key only when the pair carries a label
    combineKey: row.combineLabel ? anchorOf(row) : null,
    combineLabel: row.combineLabel,
    markTypes: templates.get(row.subjectId) ?? [],
  }));

  // sort into a steady order so the columns do not shuffle between requests
  return rules.sort((a, b) => a.name.localeCompare(b.name));
}

// full mark and pass mark per mark type, for every subject of the class.
// `subject_mark_templates` has no instituteId (it hangs off the subject), so it
// cannot go through readMany; the subjects were already institute-scoped above.
async function getMarkTemplates(subjectIds: string[]) {
  const rows = await db
    .select({
      subjectId: subjectMarkTemplates.subjectId,
      markTypeId: subjectMarkTemplates.markTypeId,
      markTypeName: examMarkTypesDrizzle.name,
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
        inArray(subjectMarkTemplates.subjectId, subjectIds),
        eq(subjectMarkTemplates.status, "ACTIVE"),
        eq(examMarkTypesDrizzle.status, "ACTIVE"),
      ),
    )
    .orderBy(asc(subjectMarkTemplates.createdAt));

  const map = new Map<string, SubjectRule["markTypes"]>();
  for (const row of rows) {
    if (!map.has(row.subjectId)) map.set(row.subjectId, []);
    map.get(row.subjectId)!.push({
      id: row.markTypeId,
      name: row.markTypeName,
      fullMark: row.fullMark,
      passMark: row.passMark,
    });
  }

  return map;
}

// every saved mark for these students in this exam
async function getMarks(
  examId: string,
  enrollmentIds: string[],
): Promise<MarkCell[]> {
  if (enrollmentIds.length === 0) return [];

  const rows = await db
    .select({
      enrollmentId: examMarks.enrollmentId,
      subjectId: examMarks.subjectId,
      markTypeId: examMarks.markTypeId,
      mark: examMarks.mark,
      absent: examMarks.absent,
      entryStatus: examMarks.entryStatus,
    })
    .from(examMarks)
    .where(
      and(
        eq(examMarks.examId, examId),
        inArray(examMarks.enrollmentId, enrollmentIds),
        eq(examMarks.status, "ACTIVE"),
      ),
    );

  return rows as MarkCell[];
}

// the grade scale: the institute's own rows when it has any, else the globals
async function getGradeScales() {
  const result = await readMany({
    drizzleSchema: examGradeRangeDrizzle,
    query: ({ db, instituteId }) =>
      db.query.examGradeRangeDrizzle.findMany({
        where: and(
          eq(examGradeRangeDrizzle.status, "ACTIVE"),
          or(
            isNull(examGradeRangeDrizzle.instituteId),
            eq(examGradeRangeDrizzle.instituteId, instituteId),
          ),
        ),
        columns: { name: true, minMark: true, maxMark: true, GPA: true },
      }),
  });

  return result.success
    ? (result.data as {
        name: string;
        minMark: number;
        maxMark: number;
        GPA: number;
      }[])
    : [];
}

// ---------------------------------------------------------------- helpers

function uniqueSections(students: StudentRule[]) {
  const seen = new Map<string, string>();
  for (const student of students) {
    if (!seen.has(student.sectionId)) {
      seen.set(student.sectionId, student.sectionName);
    }
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// the column set shown above the student rows: the union of every graded
// subject, in the order the calculator produced them
function resultColumns(
  students: OutputExamResultType["students"],
  subjects: SubjectRule[],
) {
  const columns = new Map<string, { id: string; name: string; fullMark: number }>();

  for (const student of students) {
    for (const subject of student.subjects) {
      if (!columns.has(subject.subjectId)) {
        columns.set(subject.subjectId, {
          id: subject.subjectId,
          name: subject.name,
          fullMark: subject.fullMark,
        });
      }
    }
  }

  // fall back to the configured subjects when nobody has any marks yet, so the
  // column headers still describe the paper being graded
  for (const subject of subjects) {
    if (!columns.has(subject.id)) {
      columns.set(subject.id, {
        id: subject.id,
        name: subject.name,
        fullMark: subject.markTypes.reduce((sum, type) => sum + type.fullMark, 0),
      });
    }
  }

  return [...columns.values()];
}
