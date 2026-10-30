/**
 * Result calculation — turns the marks entered for one exam + class into
 * per-student subject totals, grades, pass/fail, GPA and class positions.
 *
 * Everything here is pure: the caller resolves marks, subjects and the grade
 * scale from the database first (result.action.ts) and this module only does
 * the arithmetic. That keeps the rules unit-testable without a database.
 */

// ---------------------------------------------------------------- inputs

/** One grade band from `exam_grade_scales`. */
export type GradeScale = {
  name: string;
  minMark: number;
  maxMark: number;
  /** the band's grade point, e.g. 5.00 for A+ */
  GPA: number;
};

/** One mark type configured for a subject, with its own pass threshold. */
export type MarkTypeRule = {
  id: string;
  name: string;
  /** full mark of this component, e.g. 70 for a CQ paper */
  fullMark: number;
  /** mark needed to pass this component, e.g. 23 */
  passMark: number;
};

/** A subject as assigned to a class, with everything needed to grade it. */
export type SubjectRule = {
  id: string;
  name: string;
  /** COMPULSORY or GROUP_BASED */
  subjectType: string;
  /** an optional subject only counts when the student actually took it */
  isOptional: boolean;
  isReligion: boolean;
  /** group-scoped subject: only students in this group take it */
  groupId: string | null;
  /** the subject's mark types; a subject with none cannot be graded */
  markTypes: MarkTypeRule[];
  /**
   * Combined papers (English 1st + 2nd) are stored as two subjects. Both point
   * at the same `combineLabel`. They are summed into ONE result row so the pair
   * is graded as a single subject, matching how the mark sheet displays it.
   */
  combineKey: string | null;
  /** what the pair is called when shown together, e.g. "English" */
  combineLabel: string | null;
};

/** A student in the class, with the group they belong to. */
export type StudentRule = {
  enrollmentId: string;
  studentId: string;
  roll: string;
  englishName: string;
  banglaName: string | null;
  sectionId: string;
  sectionName: string;
  groupId: string | null;
};

/** One saved mark cell. */
export type MarkCell = {
  enrollmentId: string;
  subjectId: string;
  markTypeId: string;
  mark: number;
  absent: boolean;
  /** DRAFT or SUBMITTED */
  entryStatus: string;
};

// ---------------------------------------------------------------- outputs

export type SubjectResult = {
  /** the counted subject — for a combined pair this is the anchor id */
  subjectId: string;
  name: string;
  /** the subject ids folded into this row (the pair, or just one) */
  subjectIds: string[];
  isOptional: boolean;
  isReligion: boolean;
  obtained: number;
  fullMark: number;
  /** obtained / fullMark * 100, the value the grade scale is read against */
  percentage: number;
  grade: string;
  GPA: number;
  /** true when a component is below its pass mark, or the student was absent */
  failed: boolean;
  /** every component of this subject was flagged absent */
  absent: boolean;
  /** components whose mark is below the configured pass mark */
  failedComponents: string[];
};

export type StudentResult = {
  enrollmentId: string;
  studentId: string;
  roll: string;
  englishName: string;
  banglaName: string | null;
  sectionId: string;
  sectionName: string;
  subjects: SubjectResult[];
  totalObtained: number;
  totalFullMark: number;
  percentage: number;
  /** average of the counted subjects' grade points, 2 decimals */
  GPA: number;
  grade: string;
  /** false when a compulsory subject failed, or the student was absent in one */
  passed: boolean;
  /** overall grade is F when a compulsory subject fails */
  failedSubjects: string[];
  /** rank among the students of the same section, 1-based */
  sectionRank: number;
  /** rank across every student of the class, 1-based */
  classRank: number;
};

/** A section × subject unit that is missing marks. */
export type IncompleteUnit = {
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  /** how many student × mark-type cells are still missing */
  missing: number;
  /** enrolled students in the section (the expected count) */
  students: number;
  /** true once at least one mark for the unit has been submitted */
  submitted: boolean;
};

export type CalculationInput = {
  scales: GradeScale[];
  subjects: SubjectRule[];
  students: StudentRule[];
  marks: MarkCell[];
};

export type CalculationOutput = {
  students: StudentResult[];
  incomplete: IncompleteUnit[];
  /** true when no unit is missing marks */
  complete: boolean;
};

// ---------------------------------------------------------------- grades

/**
 * Reads a percentage against the grade scale. Bands are stored as 0-100 ranges,
 * so a subject whose full mark is not 100 is graded on its percentage rather
 * than its raw total — otherwise the 25-mark religion paper would always fail.
 *
 * Falls back to the lowest band when the percentage sits under every range, and
 * to an F/0.00 result when the scale is empty.
 */
export function gradeFor(percentage: number, scales: GradeScale[]) {
  const band = scales.find(
    (scale) => percentage >= scale.minMark && percentage <= scale.maxMark,
  );

  if (band) {
    return { grade: band.name, GPA: Number(band.GPA) };
  }

  // under the lowest band: use the weakest band so the grade still has a name
  const lowest = [...scales].sort((a, b) => a.minMark - b.minMark)[0];
  if (lowest && percentage < lowest.minMark) {
    return { grade: lowest.name, GPA: Number(lowest.GPA) };
  }

  return { grade: "F", GPA: 0 };
}

const round2 = (value: number) => Math.round(value * 100) / 100;

// ---------------------------------------------------------------- subjects

// subjects bundled into the same combined row, kept in the order given.
//
// A pair is stored as two subjects where only the second points at the first
// (`combineWith`), so the two rows carry different keys: the anchor's key is
// its own id, the second paper's key is the anchor's id. `combineAnchor` from
// the caller resolves both to the same id before we get here, which is what
// makes the pair land in one group.
function groupSubjects(subjects: SubjectRule[]) {
  const groups = new Map<string, SubjectRule[]>();
  const order: string[] = [];

  for (const subject of subjects) {
    // an uncombined subject is its own group, keyed by its id
    const key = subject.combineKey ?? subject.id;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(subject);
  }

  return order.map((key) => groups.get(key)!);
}

/**
 * Whether a student sits a subject at all.
 *
 * A group-based subject belongs to one group, so a student outside that group
 * never takes it. An optional (or religion) subject only counts once the
 * student has marks for it — otherwise every student would be handed a zero for
 * a subject they never chose.
 */
function isSubjectApplicable(
  group: SubjectRule[],
  student: StudentRule,
  markedSubjectIds: Set<string>,
) {
  const lead = group[0];
  if (!lead) return false;

  const groupScoped = group.some((subject) => subject.groupId !== null);
  if (groupScoped) {
    const applies = group.some(
      (subject) => subject.groupId === null || subject.groupId === student.groupId,
    );
    if (!applies) return false;
  }

  if (lead.isOptional || lead.isReligion) {
    return group.some((subject) => markedSubjectIds.has(subject.id));
  }

  return true;
}

// ---------------------------------------------------------------- main

/**
 * Builds every student's result and the class/section positions.
 *
 * Ranking is done on total marks first, then GPA, then roll number, so two
 * students on the same total are broken by GPA and then by roll. Students on an
 * identical total and GPA share a position (competition ranking), so the next
 * student skips ahead.
 */
export function calculateResults(input: CalculationInput): CalculationOutput {
  const { scales, subjects, students, marks } = input;

  // only subjects that actually have mark types can be graded
  const gradable = subjects.filter((subject) => subject.markTypes.length > 0);
  const groups = groupSubjects(gradable);

  // marks by enrollment + subject, so a re-query per cell is avoided
  const marksByStudent = new Map<string, Map<string, MarkCell[]>>();
  for (const cell of marks) {
    if (!marksByStudent.has(cell.enrollmentId)) {
      marksByStudent.set(cell.enrollmentId, new Map());
    }
    const bySubject = marksByStudent.get(cell.enrollmentId)!;
    if (!bySubject.has(cell.subjectId)) bySubject.set(cell.subjectId, []);
    bySubject.get(cell.subjectId)!.push(cell);
  }

  // ---------------- incomplete units (checked before anything is graded)
  const incomplete = findIncompleteUnits({ groups, students, marks });
  const complete = incomplete.length === 0;

  // ---------------- per student
  const results: StudentResult[] = students.map((student) => {
    const bySubject = marksByStudent.get(student.enrollmentId) ?? new Map();
    const markedSubjectIds = new Set(bySubject.keys());

    const subjectResults: SubjectResult[] = [];

    for (const group of groups) {
      if (!isSubjectApplicable(group, student, markedSubjectIds)) continue;

      const components: MarkCell[] = [];
      for (const subject of group) {
        components.push(...(bySubject.get(subject.id) ?? []));
      }

      const lead = group[0];
      const fullMark = group.reduce(
        (sum, subject) =>
          sum + subject.markTypes.reduce((s, type) => s + type.fullMark, 0),
        0,
      );

      // only cells that match a configured mark type count. a stray row for an
      // unconfigured type would otherwise be added on top of the full mark and
      // push the percentage over 100.
      const expected = group.flatMap((subject) =>
        subject.markTypes.map((type) => ({ subject, type })),
      );
      const obtained = expected.reduce((sum, { subject, type }) => {
        const cell = components.find(
          (c) => c.subjectId === subject.id && c.markTypeId === type.id,
        );
        return sum + (cell && !cell.absent ? cell.mark : 0);
      }, 0);

      const failedComponents: string[] = [];
      for (const subject of group) {
        for (const type of subject.markTypes) {
          const cell = components.find(
            (c) => c.subjectId === subject.id && c.markTypeId === type.id,
          );
          // a missing cell is reported by the incomplete list, not failed here
          if (!cell) continue;
          if (cell.absent || cell.mark < type.passMark) {
            failedComponents.push(
              group.length > 1 ? `${subject.name} ${type.name}` : type.name,
            );
          }
        }
      }

      // absent for the whole subject when every saved component says so
      const absent =
        components.length > 0 && components.every((cell) => cell.absent);

      const percentage =
        fullMark > 0 ? round2((obtained / fullMark) * 100) : 0;
      const { grade, GPA } = gradeFor(percentage, scales);

      // a labelled pair is shown under its combine label ("English")
      const name =
        group.length > 1 && lead.combineKey
          ? (lead.combineLabel ?? lead.name)
          : lead.name;

      subjectResults.push({
        subjectId: lead.id,
        name,
        subjectIds: group.map((subject) => subject.id),
        isOptional: lead.isOptional,
        isReligion: lead.isReligion,
        obtained: round2(obtained),
        fullMark,
        percentage,
        grade,
        GPA,
        failed: failedComponents.length > 0 || absent,
        absent,
        failedComponents,
      });
    }

    const totalObtained = round2(
      subjectResults.reduce((sum, subject) => sum + subject.obtained, 0),
    );
    const totalFullMark = subjectResults.reduce(
      (sum, subject) => sum + subject.fullMark,
      0,
    );
    const percentage =
      totalFullMark > 0 ? round2((totalObtained / totalFullMark) * 100) : 0;

    // GPA is the mean of the counted subjects' grade points, to 2 decimals.
    // A failed compulsory subject forces 0.00 and F, the rule the national
    // scale implies.
    const failedSubjects = subjectResults
      .filter((subject) => subject.failed && !subject.isOptional && !subject.isReligion)
      .map((subject) => subject.name);

    const rawGpa =
      subjectResults.length > 0
        ? subjectResults.reduce((sum, subject) => sum + subject.GPA, 0) /
          subjectResults.length
        : 0;

    const gpa = failedSubjects.length > 0 ? 0 : round2(rawGpa);
    const overall = gradeFor(percentage, scales);

    return {
      enrollmentId: student.enrollmentId,
      studentId: student.studentId,
      roll: student.roll,
      englishName: student.englishName,
      banglaName: student.banglaName,
      sectionId: student.sectionId,
      sectionName: student.sectionName,
      subjects: subjectResults,
      totalObtained,
      totalFullMark,
      percentage,
      GPA: gpa,
      grade: failedSubjects.length > 0 ? "F" : overall.grade,
      passed: failedSubjects.length === 0,
      failedSubjects,
      sectionRank: 0,
      classRank: 0,
    };
  });

  return {
    students: applyRanks(results),
    incomplete,
    complete,
  };
}

// ---------------------------------------------------------------- incomplete

/**
 * Every section × subject with a missing student × mark-type cell.
 *
 * A cell only counts as expected for a student who actually takes the subject:
 * group students take their group's papers, and an optional paper is only
 * expected from students who already have at least one mark in it. Without
 * this, an optional subject would be reported as incomplete for the whole
 * class forever.
 */
export function findIncompleteUnits({
  groups,
  students,
  marks,
}: {
  groups: SubjectRule[][];
  students: StudentRule[];
  marks: MarkCell[];
}): IncompleteUnit[] {
  const saved = new Set(
    marks.map((cell) => `${cell.enrollmentId}:${cell.subjectId}:${cell.markTypeId}`),
  );
  const submittedSubjectKeys = new Set(
    marks
      .filter((cell) => cell.entryStatus === "SUBMITTED")
      .map((cell) => `${cell.enrollmentId}:${cell.subjectId}`),
  );

  const units: IncompleteUnit[] = [];

  // one pass per section × subject, so each unit is reported once
  const bySection = new Map<string, StudentRule[]>();
  for (const student of students) {
    if (!bySection.has(student.sectionId)) bySection.set(student.sectionId, []);
    bySection.get(student.sectionId)!.push(student);
  }

  for (const [sectionId, sectionStudents] of bySection) {
    for (const group of groups) {
      for (const subject of group) {
        // students who already have at least one mark in this subject
        const markedStudents = new Set(
          marks
            .filter((cell) => cell.subjectId === subject.id)
            .map((cell) => cell.enrollmentId),
        );

        // optional subjects are only expected from students already taking them
        const optional = subject.isOptional || subject.isReligion;

        let expectedStudents = 0;
        let missing = 0;

        for (const student of sectionStudents) {
          // group scoping: a student outside the group never sits the paper
          if (subject.groupId !== null && subject.groupId !== student.groupId) {
            continue;
          }
          if (optional && !markedStudents.has(student.enrollmentId)) continue;

          expectedStudents += 1;
          for (const type of subject.markTypes) {
            if (
              !saved.has(`${student.enrollmentId}:${subject.id}:${type.id}`)
            ) {
              missing += 1;
            }
          }
        }

        if (missing === 0) continue;

        // a unit is "submitted" once any student's marks for it are submitted
        const isSubmitted = sectionStudents.some((student) =>
          submittedSubjectKeys.has(`${student.enrollmentId}:${subject.id}`),
        );

        units.push({
          sectionId,
          sectionName: sectionStudents[0]?.sectionName ?? "",
          subjectId: subject.id,
          subjectName: subject.name,
          missing,
          students: expectedStudents,
          submitted: isSubmitted,
        });
      }
    }
  }

  return units;
}

// ---------------------------------------------------------------- ranking

/**
 * Competition ranking: sorted by total marks, then GPA, then roll. Students on
 * an identical total and GPA share a position and the next one skips ahead
 * (1, 2, 2, 4). Ranked twice — once inside each section, once across the class.
 */
export function applyRanks(rows: StudentResult[]): StudentResult[] {
  const sectionRanks = rankWithin(rows, (row) => row.sectionId);
  const classRanks = rankWithin(rows, () => "ALL");

  return rows.map((row) => ({
    ...row,
    sectionRank: sectionRanks.get(row.enrollmentId) ?? 0,
    classRank: classRanks.get(row.enrollmentId) ?? 0,
  }));
}

/**
 * Ranks each student inside their bucket. `rank` is the student's best possible
 * position, so the student after a tie block jumps past it: two students tied
 * at 1st are followed by 3rd.
 */
function rankWithin(
  rows: StudentResult[],
  bucketOf: (row: StudentResult) => string,
) {
  const byBucket = new Map<string, StudentResult[]>();

  for (const row of rows) {
    const bucket = bucketOf(row);
    if (!byBucket.has(bucket)) byBucket.set(bucket, []);
    byBucket.get(bucket)!.push(row);
  }

  const ranks = new Map<string, number>();

  for (const bucket of byBucket.values()) {
    const sorted = [...bucket].sort(
      (a, b) =>
        b.totalObtained - a.totalObtained ||
        b.GPA - a.GPA ||
        a.roll.localeCompare(b.roll, undefined, { numeric: true }),
    );

    sorted.forEach((row, index) => {
      const previous = sorted[index - 1];
      const tied =
        previous &&
        previous.totalObtained === row.totalObtained &&
        previous.GPA === row.GPA;

      // a tie keeps the previous student's rank; otherwise it is position + 1
      ranks.set(
        row.enrollmentId,
        tied ? ranks.get(previous.enrollmentId)! : index + 1,
      );
    });
  }

  return ranks;
}
