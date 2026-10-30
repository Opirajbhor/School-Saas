// Pure derivations over a calculated result sheet, for the printable reports.
//
// Nothing here touches the database: every report is a view of the single
// OutputExamResultType the results page already calculates, so a report always
// agrees with the ranked table and with any published snapshot.

import { OutputExamResultType } from "../../../_schema/exam.zod";

export type StudentRow = OutputExamResultType["students"][number];
export type SubjectColumn = OutputExamResultType["subjects"][number];

// --- subject-wise aggregates, for the summary report ---

export type SubjectSummary = {
  subjectId: string;
  name: string;
  fullMark: number;
  /** students with a row for this subject */
  appeared: number;
  /** passed, excluding anyone absent in the subject */
  passed: number;
  /** below the pass mark; a student absent throughout is counted as absent instead */
  failed: number;
  /** absent in every component of the subject */
  absent: number;
  /** average obtained mark over the students who appeared, 2 decimals */
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
  /** grade -> how many students got it */
  gradeCounts: { grade: string; count: number }[];
};

/**
 * One summary row per subject, in the sheet's display order.
 *
 * `absent` students are excluded from `failed` on purpose: the calculator marks
 * them failed too, so counting both would report more failures than there are
 * students. Absent is reported separately instead.
 */
export function summariseSubjects(
  sheet: OutputExamResultType,
): SubjectSummary[] {
  return sheet.subjects.map((column) => {
    const grades: string[] = [];
    let appeared = 0;
    let passed = 0;
    let failed = 0;
    let absent = 0;
    let total = 0;
    let highest = 0;
    let lowest = 0;

    for (const student of sheet.students) {
      const cell = student.subjects.find(
        (subject) => subject.subjectId === column.id,
      );
      if (!cell) continue;

      appeared += 1;
      total += cell.obtained;
      grades.push(cell.absent ? "AB" : cell.grade);

      if (cell.absent) {
        absent += 1;
      } else if (cell.failed) {
        failed += 1;
      } else {
        passed += 1;
      }

      if (appeared === 1) {
        highest = cell.obtained;
        lowest = cell.obtained;
      } else {
        highest = Math.max(highest, cell.obtained);
        lowest = Math.min(lowest, cell.obtained);
      }
    }

    // count grades in the order the sheet lists subjects, so A+ leads A
    const tally = new Map<string, number>();
    for (const grade of grades) {
      tally.set(grade, (tally.get(grade) ?? 0) + 1);
    }
    const gradeCounts = [...tally.entries()]
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => gradeOrder(a.grade) - gradeOrder(b.grade));

      return {
        subjectId: column.id,
        name: column.name,
        fullMark: column.fullMark,
        appeared,
        passed,
        failed,
        absent,
        average: appeared === 0 ? 0 : round2(total / appeared),
        highest,
        lowest,
        // absent students are left out of the denominator, so a subject is not
        // made to look worse just because someone did not sit it
        passRate: passed + failed === 0 ? 0 : round2((passed / (passed + failed)) * 100),
        gradeCounts,
      };
  });
}

// conventional grade order, so tallies read A+ → F and absent last
const GRADE_ORDER = ["A+", "A", "A-", "B", "C", "D", "F", "AB"];
function gradeOrder(grade: string) {
  const index = GRADE_ORDER.indexOf(grade);
  return index === -1 ? GRADE_ORDER.length : index;
}

// --- merit list ---

export type MeritRow = {
  classRank: number;
  sectionRank: number;
  enrollmentId: string;
  studentId: string;
  roll: string;
  englishName: string;
  banglaName: string | null;
  sectionId: string;
  sectionName: string;
  totalObtained: number;
  totalFullMark: number;
  percentage: number;
  GPA: number;
  grade: string;
  passed: boolean;
  failedSubjects: string[];
};

/**
 * Students ordered by class position. An optional section narrows the list and
 * re-ranks it 1..n within that section, so a section merit list is meaningful
 * on its own rather than showing class ranks with gaps.
 */
export function buildMeritList(
  sheet: OutputExamResultType,
  sectionId?: string,
): MeritRow[] {
  const rows = sheet.students
    .filter((student) => !sectionId || student.sectionId === sectionId)
    .sort((a, b) => a.classRank - b.classRank);

  return rows.map((student, index) => ({
    classRank: sectionId ? index + 1 : student.classRank,
    sectionRank: student.sectionRank,
    enrollmentId: student.enrollmentId,
    studentId: student.studentId,
    roll: student.roll,
    englishName: student.englishName,
    banglaName: student.banglaName,
    sectionId: student.sectionId,
    sectionName: student.sectionName,
    totalObtained: student.totalObtained,
    totalFullMark: student.totalFullMark,
    percentage: student.percentage,
    GPA: student.GPA,
    grade: student.grade,
    passed: student.passed,
    failedSubjects: student.failedSubjects,
  }));
}

// --- lookup ---

/** The student a report card is for, or null when the id is not in this sheet. */
export function findStudent(sheet: OutputExamResultType, enrollmentId: string) {
  return (
    sheet.students.find((student) => student.enrollmentId === enrollmentId) ??
    null
  );
}

/** Students of one section, or all of them when no section is given. */
export function studentsInSection(
  sheet: OutputExamResultType,
  sectionId?: string,
) {
  if (!sectionId) return sheet.students;
  return sheet.students.filter((student) => student.sectionId === sectionId);
}

/**
 * The class-level pass/fail split for the header of a report. Totals are summed
 * from the same rows the table shows, so the two can never disagree.
 */
export function classTotals(students: StudentRow[]) {
  const passed = students.filter((student) => student.passed).length;
  const failed = students.length - passed;
  const withMarks = students.filter((student) => student.totalFullMark > 0);
  const average =
    withMarks.length === 0
      ? 0
      : round2(
          withMarks.reduce((sum, student) => sum + student.percentage, 0) /
            withMarks.length,
        );
  const gpa =
    withMarks.length === 0
      ? 0
      : round2(
          withMarks.reduce((sum, student) => sum + student.GPA, 0) /
            withMarks.length,
        );

  return { total: students.length, passed, failed, average, gpa };
}

/** A short label for the report's status line. */
export function workflowLabel(sheet: OutputExamResultType) {
  if (sheet.fromSnapshot) {
    return `Published — frozen at version ${sheet.snapshotVersion}`;
  }
  if (sheet.exam.markWorkflow === "PUBLISHED") {
    return "Published";
  }
  if (sheet.exam.markWorkflow === "FINALIZED") {
    return "Finalized — not yet published";
  }
  return "Draft — marks are still open";
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
