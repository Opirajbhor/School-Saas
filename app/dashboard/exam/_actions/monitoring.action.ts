"use server";

import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import { compareClassName } from "@/src/validation/classes.zod";
import { db } from "@/src/drizzle-DB";
import {
  academicSessions,
  classesDrizzle,
  enrollments,
  examClasses,
  examMarkEditRequests,
  examMarkTypesDrizzle,
  examMarks,
  exams,
  sectionDrizzle,
  sectionSubjectTeachers,
  student,
  subjectAssignSchema,
  subjectDbSchema,
  subjectMarkTemplates,
  teachers,
} from "@/src/drizzle-DB/schema";
import {
  ClassMonitoringType,
  ExamDashboardType,
  ExamMonitoringSummaryType,
  MonitoringCompletionStatus,
  MonitoringUnitType,
  SubjectMonitoringType,
  examIdZod,
  examMarkColumnsZod,
  InputExamMarkColumnsType,
} from "../_schema/exam.zod";

// ================== shared shapes ==================

type UnitScope = {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string | null;
  teacherName: string | null;
  sessionId: string;
};

// raw counters for one unit, straight out of the database
type UnitCounts = {
  eligibleStudents: number;
  requiredMarks: number;
  enteredMarks: number;
  submittedRows: number;
  totalRows: number;
};

// ================== authorization ==================

// monitoring is an admin surface. Teachers get their own scoped views via the
// subject monitoring action, where the section+subject assignment is checked.
async function requireAdmin() {
  const ctx = await getUserContext();
  if (!ctx) {
    return { ok: false as const, error: "No User session found" };
  }
  if (ctx.role !== "admin") {
    return { ok: false as const, error: "Not authorized" };
  }
  return { ok: true as const, ctx };
}

// ================== exam list summaries ==================

// one lightweight aggregate per exam — no student rows here
export async function getExamMonitoringSummaries() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: auth.error, details: {} };
  }

  try {
    const rows = await db
      .select({
        examId: exams.id,
        examName: exams.name,
        sessionName: academicSessions.year,
        assignedClasses:
          sql<number>`count(distinct ${examClasses.classId})`.mapWith(Number),
      })
      .from(exams)
      .leftJoin(
        examClasses,
        and(
          eq(examClasses.examId, exams.id),
          eq(examClasses.status, "ACTIVE"),
        ),
      )
      .leftJoin(academicSessions, eq(academicSessions.id, exams.sessionId))
      .where(
        and(
          eq(exams.status, "ACTIVE"),
          or(
            isNull(exams.instituteId),
            eq(exams.instituteId, auth.ctx.instituteId),
          ),
        ),
      )
      .groupBy(exams.id, exams.name, academicSessions.year)
      .orderBy(asc(exams.name));

    // completed cells per exam, from the same pool the unit math uses
    const cellCounts = await db
      .select({
        examId: examMarks.examId,
        enteredMarks: sql<number>`count(*)`.mapWith(Number),
      })
      .from(examMarks)
      .where(
        and(
          eq(examMarks.instituteId, auth.ctx.instituteId),
          eq(examMarks.status, "ACTIVE"),
        ),
      )
      .groupBy(examMarks.examId);
    const enteredByExam = new Map(
      cellCounts.map((row) => [row.examId, row.enteredMarks]),
    );

    const requestCounts = await db
      .select({
        examId: examMarkEditRequests.examId,
        pending: sql<number>`count(*)`.mapWith(Number),
      })
      .from(examMarkEditRequests)
      .where(
        and(
          eq(examMarkEditRequests.instituteId, auth.ctx.instituteId),
          eq(examMarkEditRequests.status, "PENDING"),
        ),
      )
      .groupBy(examMarkEditRequests.examId);
    const pendingByExam = new Map(
      requestCounts.map((row) => [row.examId, row.pending]),
    );

    const summaries: ExamMonitoringSummaryType[] = [];
    for (const row of rows) {
      const unitScopes = await getExamUnitScopes(
        row.examId,
        auth.ctx.instituteId,
      );
      const [required, unitCounts] = await Promise.all([
        getRequiredCells(unitScopes),
        getUnitCounts(row.examId, unitScopes, auth.ctx.instituteId),
      ]);

      // reuse the unit math so the list and the dashboard can never disagree
      const completedUnits = unitScopes.filter(
        (scope) =>
          buildUnit(
            scope,
            unitCounts.get(unitKey(scope)) ?? EMPTY_COUNTS,
            undefined,
          ).status === "COMPLETED",
      ).length;
      const entered = enteredByExam.get(row.examId) ?? 0;

      summaries.push(
        buildExamSummary({
          examId: row.examId,
          examName: row.examName,
          sessionName: row.sessionName,
          assignedClasses: row.assignedClasses,
          requiredMarks: required.requiredMarks,
          enteredMarks: Math.min(entered, required.requiredMarks),
          units: unitScopes.length,
          completedUnits,
          pendingRequests: pendingByExam.get(row.examId) ?? 0,
        }),
      );
    }

    return { success: true as const, data: summaries };
  } catch (error) {
    console.error("Failed to load exam monitoring summaries:", error);
    return {
      success: false as const,
      error: "Failed to load exam monitoring data",
      details: {},
    };
  }
}

// ================== exam dashboard ==================

export async function getExamDashboard(examId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: auth.error, details: {} };
  }

  const parsed = parseWithZod(examIdZod, examId);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }

  try {
    const examRows = await db
      .select({
        id: exams.id,
        name: exams.name,
        sessionName: academicSessions.year,
      })
      .from(exams)
      .leftJoin(academicSessions, eq(academicSessions.id, exams.sessionId))
      .where(
        and(
          eq(exams.id, parsed.data),
          or(
            isNull(exams.instituteId),
            eq(exams.instituteId, auth.ctx.instituteId),
          ),
        ),
      )
      .limit(1);

    const exam = examRows[0];
    if (!exam) {
      return { success: false as const, error: "Exam not found", details: {} };
    }

    const scopes = await getExamUnitScopes(parsed.data, auth.ctx.instituteId);
    const counts = await getUnitCounts(
      parsed.data,
      scopes,
      auth.ctx.instituteId,
    );
    const requests = await getRequestCounts(parsed.data, auth.ctx.instituteId);

    const units: MonitoringUnitType[] = scopes.map((scope) => {
      const unitCounts = counts.get(unitKey(scope)) ?? EMPTY_COUNTS;
      const requestCount = requests.get(unitKey(scope));
      return buildUnit(scope, unitCounts, requestCount);
    });

    const configuredUnits = units.filter((unit) => unit.configured);
    const completedUnits = configuredUnits.filter(
      (unit) => unit.status === "COMPLETED",
    ).length;
    const totalRequired = configuredUnits.reduce(
      (sum, unit) => sum + unit.requiredMarks,
      0,
    );
    const totalEntered = configuredUnits.reduce(
      (sum, unit) => sum + unit.enteredMarks,
      0,
    );

    // class-wise grouping, built from the same units so the numbers always agree
    const classMap = new Map<string, ClassMonitoringType>();
    for (const scope of scopes) {
      const unit = units.find((item) => unitKey(item) === unitKey(scope));
      if (!unit) continue;

      const entry = classMap.get(scope.classId) ?? {
        classId: scope.classId,
        className: scope.className,
        sections: [],
        units: 0,
        completed: 0,
        completion: 0,
      };

      let section = entry.sections.find(
        (item) => item.sectionId === scope.sectionId,
      );
      if (!section) {
        section = {
          sectionId: scope.sectionId,
          sectionName: scope.sectionName,
          units: 0,
          completed: 0,
          completion: 0,
        };
        entry.sections.push(section);
      }

      if (unit.configured) {
        entry.units += 1;
        section.units += 1;
        if (unit.status === "COMPLETED") {
          entry.completed += 1;
          section.completed += 1;
        }
      }

      classMap.set(scope.classId, entry);
    }

    const classes = [...classMap.values()].map((entry) => ({
      ...entry,
      // section completion is the average of its configured units
      sections: entry.sections.map((section) => ({
        ...section,
        completion: percentage(section.completed, section.units),
      })),
      completion: percentage(entry.completed, entry.units),
    }));

    const data: ExamDashboardType = {
      exam: {
        id: exam.id,
        name: exam.name,
        sessionName: exam.sessionName ?? null,
      },
      summary: {
        totalUnits: units.length,
        completedUnits,
        incompleteUnits: configuredUnits.length - completedUnits,
        unconfiguredUnits: units.length - configuredUnits.length,
        completion: percentage(totalEntered, totalRequired),
        pendingRequests: [...requests.values()].reduce(
          (sum, countsForUnit) => sum + countsForUnit.pending,
          0,
        ),
      },
      classes,
      units,
    };

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load exam dashboard:", error);
    return {
      success: false as const,
      error: "Failed to load exam dashboard",
      details: {},
    };
  }
}

// ================== subject monitoring ==================

export async function getSubjectMonitoring(data: InputExamMarkColumnsType) {
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
    // say which parameter is wrong instead of the generic "Validation failed"
    const field = Object.keys(parsed.details ?? {})[0];
    return {
      success: false as const,
      error: field
        ? `Invalid ${field} for this subject`
        : "Missing exam, class, section or subject",
      details: parsed.details,
    };
  }
  const { examId, classId, sectionId, subjectId } = parsed.data;
  const { instituteId, role, teacherId } = ctx;

  try {
    const examRows = await db
      .select({ id: exams.id, name: exams.name })
      .from(exams)
      .where(
        and(
          eq(exams.id, examId),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
      )
      .limit(1);
    const exam = examRows[0];
    if (!exam) {
      return { success: false as const, error: "Exam not found", details: {} };
    }

    const sectionRows = await db
      .select({
        sectionId: sectionDrizzle.id,
        sectionName: sectionDrizzle.name,
        classId: classesDrizzle.id,
        className: classesDrizzle.name,
        subjectId: subjectDbSchema.id,
        subjectName: subjectDbSchema.name,
        teacherId: teachers.id,
        teacherName: teachers.nameEnglish,
      })
      .from(sectionDrizzle)
      .innerJoin(classesDrizzle, eq(classesDrizzle.id, sectionDrizzle.classId))
      .innerJoin(
        subjectAssignSchema,
        and(
          eq(subjectAssignSchema.classId, sectionDrizzle.classId),
          eq(subjectAssignSchema.status, "ACTIVE"),
        ),
      )
      .innerJoin(
        subjectDbSchema,
        eq(subjectDbSchema.id, subjectAssignSchema.subjectId),
      )
      .leftJoin(
        sectionSubjectTeachers,
        and(
          eq(sectionSubjectTeachers.sectionId, sectionDrizzle.id),
          eq(sectionSubjectTeachers.subjectId, subjectDbSchema.id),
          eq(sectionSubjectTeachers.status, "ACTIVE"),
        ),
      )
      .leftJoin(teachers, eq(teachers.id, sectionSubjectTeachers.teacherId))
      .where(
        and(
          eq(sectionDrizzle.id, sectionId),
          eq(classesDrizzle.id, classId),
          eq(subjectDbSchema.id, subjectId),
          eq(sectionDrizzle.instituteId, instituteId),
        ),
      )
      .limit(1);

    const scopeRow = sectionRows[0];
    if (!scopeRow) {
      return {
        success: false as const,
        error: "This subject is not assigned to the selected section",
        details: {},
      };
    }

    // a teacher may only open a section + subject they are assigned to
    if (role !== "admin" && scopeRow.teacherId !== teacherId) {
      return {
        success: false as const,
        error: "Not authorized for this subject",
        details: {},
      };
    }

    const [markTypeRows, studentRows, savedMarks, request] = await Promise.all([
      getSubjectMarkTypes(subjectId, instituteId),
      getEligibleStudents(classId, sectionId, instituteId),
      getUnitMarks(examId, sectionId, subjectId, instituteId),
      getUnitRequest(examId, sectionId, subjectId, instituteId),
    ]);

    const approved = request?.status === "APPROVED";
    const submitted = savedMarks.submittedRows > 0;
    const entryStatus: "DRAFT" | "SUBMITTED" = submitted
      ? "SUBMITTED"
      : "DRAFT";
    // admins always may edit; teachers only while draft or after an approval
    const canEdit = role === "admin" || !submitted || approved;

    const requiredPerStudent = markTypeRows.length;
    const students = studentRows.map((studentRow) => {
      const saved = savedMarks.byStudent.get(studentRow.studentId) ?? new Map();
      let entered = 0;
      let studentAbsent = false;

      const marks = markTypeRows.map((type) => {
        const cell = saved.get(type.id);
        if (cell) {
          entered += 1;
          if (cell.absent) studentAbsent = true;
        }
        return {
          markTypeId: type.id,
          mark: cell?.mark ?? 0,
          absent: cell?.absent ?? false,
        };
      });

      return {
        studentId: studentRow.studentId,
        roll: studentRow.roll,
        englishName: studentRow.englishName,
        banglaName: studentRow.banglaName,
        absent: studentAbsent,
        entered,
        required: requiredPerStudent,
        missing: Math.max(0, requiredPerStudent - entered),
        complete: requiredPerStudent > 0 && entered >= requiredPerStudent,
        marks,
      };
    });

    const eligibleStudents = students.length;
    const requiredMarks = eligibleStudents * requiredPerStudent;
    const enteredMarks = students.reduce(
      (sum, student) => sum + student.entered,
      0,
    );

    const data: SubjectMonitoringType = {
      exam: { id: exam.id, name: exam.name },
      class: { id: scopeRow.classId, name: scopeRow.className },
      section: { id: scopeRow.sectionId, name: scopeRow.sectionName },
      subject: { id: scopeRow.subjectId, name: scopeRow.subjectName },
      teacher: scopeRow.teacherId
        ? { id: scopeRow.teacherId, nameEnglish: scopeRow.teacherName ?? "" }
        : null,
      entryStatus,
      markTypes: markTypeRows.map((type) => ({
        id: type.id,
        name: type.name,
        fullMark: type.fullMark,
      })),
      canEdit,
      editRequest: request
        ? {
            id: request.id,
            status: request.status,
            reason: request.reason,
            requestedBy: request.requestedByName ?? "",
            requestedAt: request.createdAt,
            resolutionNote: request.resolutionNote,
            resolvedBy: request.resolvedByName,
            resolvedAt: request.resolvedAt,
          }
        : null,
      summary: {
        eligibleStudents,
        requiredMarks,
        enteredMarks,
        missingMarks: Math.max(0, requiredMarks - enteredMarks),
        absentStudents: students.filter((student) => student.absent).length,
        studentsWithMissingMarks: students.filter(
          (student) => student.missing > 0,
        ).length,
        completion: percentage(enteredMarks, requiredMarks),
      },
      students,
    };

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load subject monitoring:", error);
    return {
      success: false as const,
      error: "Failed to load subject monitoring data",
      details: {},
    };
  }
}

// ================== progress engine ==================

const EMPTY_COUNTS: UnitCounts = {
  eligibleStudents: 0,
  requiredMarks: 0,
  enteredMarks: 0,
  submittedRows: 0,
  totalRows: 0,
};

const unitKey = (scope: { sectionId: string; subjectId: string }) =>
  `${scope.sectionId}:${scope.subjectId}`;

const percentage = (part: number, whole: number) =>
  whole <= 0 ? 0 : Math.round((part / whole) * 100);

// every section × subject pair of every class assigned to the exam.
// mirrors getSingleClassSubjects: all subjects of the class count for
// each section; the teacher comes from section_subject_teachers when set.
async function getExamUnitScopes(
  examId: string,
  instituteId: string,
): Promise<UnitScope[]> {
  const rows = await db
    .select({
      classId: classesDrizzle.id,
      className: classesDrizzle.name,
      sectionId: sectionDrizzle.id,
      sectionName: sectionDrizzle.name,
      sessionId: sectionDrizzle.sessionId,
      subjectId: subjectDbSchema.id,
      subjectName: subjectDbSchema.name,
      subjectCode: subjectDbSchema.code,
      teacherId: teachers.id,
      teacherName: teachers.nameEnglish,
    })
    .from(examClasses)
    .innerJoin(classesDrizzle, eq(classesDrizzle.id, examClasses.classId))
    .innerJoin(
      sectionDrizzle,
      and(
        eq(sectionDrizzle.classId, classesDrizzle.id),
        eq(sectionDrizzle.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      subjectAssignSchema,
      and(
        eq(subjectAssignSchema.classId, classesDrizzle.id),
        eq(subjectAssignSchema.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      subjectDbSchema,
      eq(subjectDbSchema.id, subjectAssignSchema.subjectId),
    )
    .leftJoin(
      sectionSubjectTeachers,
      and(
        eq(sectionSubjectTeachers.sectionId, sectionDrizzle.id),
        eq(sectionSubjectTeachers.subjectId, subjectDbSchema.id),
        eq(sectionSubjectTeachers.status, "ACTIVE"),
      ),
    )
    .leftJoin(teachers, eq(teachers.id, sectionSubjectTeachers.teacherId))
    .where(
      and(
        eq(examClasses.examId, examId),
        eq(examClasses.status, "ACTIVE"),
        eq(classesDrizzle.status, "ACTIVE"),
        eq(subjectDbSchema.status, "ACTIVE"),
        or(
          isNull(examClasses.instituteId),
          eq(examClasses.instituteId, instituteId),
        ),
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
    .orderBy(
      asc(sectionDrizzle.name),
      asc(subjectDbSchema.name),
    );

  // the class part of the sort is done here so "Class 10" does not come before
  // "Class 6". sort is stable, so the section and subject order the query
  // already applied is preserved within each class.
  return rows.sort((a, b) =>
    compareClassName({ name: a.className }, { name: b.className }),
  );
}

// required cells = eligible students × configured mark types, summed per unit.
// an unconfigured unit (no students or no mark types) yields 0 and is later
// excluded so it can never inflate completion.
async function getRequiredCells(scopes: UnitScope[]) {
  const sectionIds = [...new Set(scopes.map((scope) => scope.sectionId))];
  if (sectionIds.length === 0) {
    return { requiredMarks: 0 };
  }

  const students = await db
    .select({
      sectionId: enrollments.sectionId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(enrollments)
    .where(
      and(
        inArray(enrollments.sectionId, sectionIds),
        eq(enrollments.status, "ACTIVE"),
      ),
    )
    .groupBy(enrollments.sectionId);
  const studentsBySection = new Map(
    students.map((row) => [row.sectionId, row.count]),
  );

  const subjects = [...new Set(scopes.map((scope) => scope.subjectId))];
  const markTypes = await db
    .select({
      subjectId: subjectMarkTemplates.subjectId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(subjectMarkTemplates)
    .innerJoin(
      examMarkTypesDrizzle,
      eq(examMarkTypesDrizzle.id, subjectMarkTemplates.markTypeId),
    )
    .where(
      and(
        inArray(subjectMarkTemplates.subjectId, subjects),
        eq(subjectMarkTemplates.status, "ACTIVE"),
        eq(examMarkTypesDrizzle.status, "ACTIVE"),
      ),
    )
    .groupBy(subjectMarkTemplates.subjectId);
  const typesBySubject = new Map(
    markTypes.map((row) => [row.subjectId, row.count]),
  );

  const requiredMarks = scopes.reduce(
    (sum, scope) =>
      sum +
      (studentsBySection.get(scope.sectionId) ?? 0) *
        (typesBySubject.get(scope.subjectId) ?? 0),
    0,
  );

  return { requiredMarks };
}

// entered / submitted counters per unit, straight from exam_marks.
// `absent` rows count as filled because the absent flag is the recorded value.
async function getUnitCounts(
  examId: string,
  scopes: UnitScope[],
  instituteId: string,
) {
  const map = new Map<string, UnitCounts>();
  const sectionIds = [...new Set(scopes.map((scope) => scope.sectionId))];
  if (sectionIds.length === 0) return map;

  const [studentsBySection, marksBySection, typesBySubject] = await Promise.all([
    getSectionStudentCounts(sectionIds, instituteId),
    getSectionMarkCounts(examId, sectionIds, instituteId),
    getMarkTypesPerSubject(scopes.map((scope) => scope.subjectId)),
  ]);

  for (const scope of scopes) {
    const eligibleStudents = studentsBySection.get(scope.sectionId) ?? 0;
    const requiredMarks =
      eligibleStudents * (typesBySubject.get(scope.subjectId) ?? 0);
    const subjectCounts = marksBySection
      .get(scope.sectionId)
      ?.get(scope.subjectId);

    map.set(unitKey(scope), {
      eligibleStudents,
      requiredMarks,
      enteredMarks: subjectCounts?.enteredMarks ?? 0,
      submittedRows: subjectCounts?.submittedRows ?? 0,
      totalRows: subjectCounts?.totalRows ?? 0,
    });
  }

  return map;
}

async function getSectionStudentCounts(
  sectionIds: string[],
  instituteId: string,
) {
  const rows = await db
    .select({
      sectionId: enrollments.sectionId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.instituteId, instituteId),
        eq(enrollments.status, "ACTIVE"),
        inArray(enrollments.sectionId, sectionIds),
      ),
    )
    .groupBy(enrollments.sectionId);

  return new Map(rows.map((row) => [row.sectionId, row.count]));
}

type SubjectMarkCounts = {
  enteredMarks: number;
  submittedRows: number;
  totalRows: number;
};

// entered / submitted counters, sectionId -> subjectId -> counts
async function getSectionMarkCounts(
  examId: string,
  sectionIds: string[],
  instituteId: string,
): Promise<Map<string, Map<string, SubjectMarkCounts>>> {
  const rows = await db
    .select({
      sectionId: enrollments.sectionId,
      subjectId: examMarks.subjectId,
      enteredMarks: sql<number>`count(*)`.mapWith(Number),
      submittedRows:
        sql<number>`count(*) filter (where ${examMarks.entryStatus} = 'SUBMITTED')`.mapWith(
          Number,
        ),
      totalRows: sql<number>`count(*)`.mapWith(Number),
    })
    .from(examMarks)
    .innerJoin(enrollments, eq(enrollments.id, examMarks.enrollmentId))
    .where(
      and(
        eq(examMarks.instituteId, instituteId),
        eq(examMarks.examId, examId),
        eq(examMarks.status, "ACTIVE"),
        inArray(enrollments.sectionId, sectionIds),
      ),
    )
    .groupBy(enrollments.sectionId, examMarks.subjectId);

  const map = new Map<string, Map<string, SubjectMarkCounts>>();
  for (const row of rows) {
    const bySubject = map.get(row.sectionId) ?? new Map();
    bySubject.set(row.subjectId, {
      enteredMarks: row.enteredMarks,
      submittedRows: row.submittedRows,
      totalRows: row.totalRows,
    });
    map.set(row.sectionId, bySubject);
  }

  return map;
}

async function getMarkTypesPerSubject(subjectIds: string[]) {
  const unique = [...new Set(subjectIds)];
  if (unique.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      subjectId: subjectMarkTemplates.subjectId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(subjectMarkTemplates)
    .innerJoin(
      examMarkTypesDrizzle,
      eq(examMarkTypesDrizzle.id, subjectMarkTemplates.markTypeId),
    )
    .where(
      and(
        inArray(subjectMarkTemplates.subjectId, unique),
        eq(subjectMarkTemplates.status, "ACTIVE"),
        eq(examMarkTypesDrizzle.status, "ACTIVE"),
      ),
    )
    .groupBy(subjectMarkTemplates.subjectId);

  return new Map(rows.map((row) => [row.subjectId, row.count]));
}

// pending / approved request counts per unit
async function getRequestCounts(examId: string, instituteId: string) {
  const rows = await db
    .select({
      sectionId: examMarkEditRequests.sectionId,
      subjectId: examMarkEditRequests.subjectId,
      pending:
        sql<number>`count(*) filter (where ${examMarkEditRequests.status} = 'PENDING')`.mapWith(
          Number,
        ),
      approved:
        sql<number>`count(*) filter (where ${examMarkEditRequests.status} = 'APPROVED')`.mapWith(
          Number,
        ),
    })
    .from(examMarkEditRequests)
    .where(
      and(
        eq(examMarkEditRequests.instituteId, instituteId),
        eq(examMarkEditRequests.examId, examId),
      ),
    )
    .groupBy(examMarkEditRequests.sectionId, examMarkEditRequests.subjectId);

  return new Map(
    rows.map((row) => [
      `${row.sectionId}:${row.subjectId}`,
      { pending: row.pending, approved: row.approved },
    ]),
  );
}

// completion state for one unit, from the counters
function buildUnit(
  scope: UnitScope,
  counts: UnitCounts,
  requests: { pending: number; approved: number } | undefined,
): MonitoringUnitType {
  const configured = counts.requiredMarks > 0;
  const fullyEntered =
    configured && counts.enteredMarks >= counts.requiredMarks;
  // every stored row of the unit must be submitted, otherwise it is still draft
  const fullySubmitted =
    counts.totalRows > 0 && counts.submittedRows >= counts.totalRows;
  const completed = fullyEntered && fullySubmitted;

  let status: MonitoringCompletionStatus;
  if (!configured) {
    status = "NOT_STARTED";
  } else if (completed) {
    status = "COMPLETED";
  } else if (counts.enteredMarks === 0) {
    status = "NOT_STARTED";
  } else {
    status = "IN_PROGRESS";
  }

  return {
    classId: scope.classId,
    className: scope.className,
    sectionId: scope.sectionId,
    sectionName: scope.sectionName,
    subjectId: scope.subjectId,
    subjectName: scope.subjectName,
    subjectCode: scope.subjectCode,
    teacher: scope.teacherId
      ? { id: scope.teacherId, nameEnglish: scope.teacherName ?? "" }
      : null,
    eligibleStudents: counts.eligibleStudents,
    requiredMarks: counts.requiredMarks,
    enteredMarks: counts.enteredMarks,
    missingMarks: Math.max(0, counts.requiredMarks - counts.enteredMarks),
    completion: percentage(counts.enteredMarks, counts.requiredMarks),
    entryStatus: fullySubmitted ? "SUBMITTED" : "DRAFT",
    status,
    configured,
    pendingRequests: requests?.pending ?? 0,
    approvedRequests: requests?.approved ?? 0,
  };
}

// exam-level roll-up from the unit totals
function buildExamSummary({
  examId,
  examName,
  sessionName,
  assignedClasses,
  requiredMarks,
  enteredMarks,
  units,
  completedUnits,
  pendingRequests,
}: {
  examId: string;
  examName: string;
  sessionName: string | null;
  assignedClasses: number;
  requiredMarks: number;
  enteredMarks: number;
  units: number;
  completedUnits: number;
  pendingRequests: number;
}): ExamMonitoringSummaryType {
  const completion = percentage(enteredMarks, requiredMarks);
  const status: ExamMonitoringSummaryType["status"] =
    requiredMarks === 0 || enteredMarks === 0
      ? "NOT_STARTED"
      : completedUnits > 0 && completedUnits >= units
        ? "COMPLETED"
        : "IN_PROGRESS";

  return {
    examId,
    examName,
    sessionName: sessionName ?? null,
    assignedClasses,
    units,
    completedUnits,
    completion,
    status,
    pendingRequests,
  };
}

// ================== unit-level helpers ==================

async function getSubjectMarkTypes(subjectId: string, instituteId: string) {
  const rows = await db
    .select({
      id: examMarkTypesDrizzle.id,
      name: examMarkTypesDrizzle.name,
      fullMark: subjectMarkTemplates.fullMark,
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

  return rows;
}

async function getEligibleStudents(
  classId: string,
  sectionId: string,
  instituteId: string,
) {
  return db
    .select({
      studentId: enrollments.studentId,
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
    .orderBy(asc(enrollments.roll));
}

// marks for one unit, keyed by student, plus the submission counters
async function getUnitMarks(
  examId: string,
  sectionId: string,
  subjectId: string,
  instituteId: string,
) {
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

  const byStudent = new Map<
    string,
    Map<string, { mark: number; absent: boolean }>
  >();
  let submittedRows = 0;

  for (const row of rows) {
    const cells = byStudent.get(row.studentId) ?? new Map();
    cells.set(row.markTypeId, { mark: row.mark, absent: row.absent });
    byStudent.set(row.studentId, cells);
    if (row.entryStatus === "SUBMITTED") submittedRows += 1;
  }

  return { byStudent, submittedRows, totalRows: rows.length };
}

// the current request for a unit — APPROVED unlocks, PENDING is shown as waiting
async function getUnitRequest(
  examId: string,
  sectionId: string,
  subjectId: string,
  instituteId: string,
) {
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
      requestedByName: requestedBy.nameEnglish,
      resolvedByName: resolvedBy.nameEnglish,
    })
    .from(examMarkEditRequests)
    .leftJoin(
      requestedBy,
      eq(requestedBy.id, examMarkEditRequests.requestedById),
    )
    .leftJoin(resolvedBy, eq(resolvedBy.id, examMarkEditRequests.resolvedById))
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
