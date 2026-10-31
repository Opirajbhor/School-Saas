"use server";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import {
  academicSessions,
  classesDrizzle,
  enrollments,
  examClasses,
  examMarkEditRequests,
  examMarks,
  exams,
  sectionClassTeachers,
  sectionDrizzle,
  student,
  subjectAssignSchema,
  subjectDbSchema,
  teachers,
} from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";

export type DashboardCounts = {
  students: number;
  maleStudents: number;
  femaleStudents: number;
  sections: number;
  teachers: number;
  classes: number;
  subjects: number;
  generalSubjects: number;
  electiveSubjects: number;
};

// General vs group-elective split from the assignments table. `distinct` because
// one subject can be assigned to several classes and must not be counted twice.
async function getSubjectTypeSplit(instituteId: string) {
  try {
    const rows = await db
      .selectDistinct({
        subjectId: subjectAssignSchema.subjectId,
        subjectType: subjectAssignSchema.subject_type,
      })
      .from(subjectAssignSchema)
      .where(
        and(
          or(
            isNull(subjectAssignSchema.instituteId),
            eq(subjectAssignSchema.instituteId, instituteId),
          ),
          eq(subjectAssignSchema.status, "ACTIVE"),
        ),
      );

    return {
      generalSubjects: rows.filter((r) => r.subjectType === "COMPULSORY").length,
      electiveSubjects: rows.filter((r) => r.subjectType === "GROUP_BASED")
        .length,
    };
  } catch (error) {
    // the split is supplementary — never fail the whole card over it
    console.error("Failed to load subject type split:", error);
    return { generalSubjects: 0, electiveSubjects: 0 };
  }
}

// Real counts for the four headline cards, scoped to the viewer's institute.
// There is no historical snapshot table, so deltas ("vs last term") cannot be
// computed and are deliberately absent — an invented trend is worse than none.
export async function getDashboardCounts() {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No user session found",
        details: {},
      };
    }
    const { instituteId } = ctx;

    const activeEnrollments = and(
      eq(enrollments.instituteId, instituteId),
      eq(enrollments.status, "ACTIVE"),
    );

    const [
      enrollmentRows,
      teacherRows,
      classRows,
      subjectRows,
      sectionRows,
    ] = await Promise.all([
      db
        .select({
          id: enrollments.id,
          sectionId: enrollments.sectionId,
          studentId: enrollments.studentId,
        })
        .from(enrollments)
        .where(activeEnrollments),
      db
        .select({ id: teachers.id, status: teachers.status })
        .from(teachers)
        .where(eq(teachers.instituteId, instituteId)),
      db
        .select({ id: classesDrizzle.id, status: classesDrizzle.status })
        .from(classesDrizzle)
        // classes are global defaults (instituteId null), so a strict
        // institute match returns nothing — same rule as the classes page
        .where(
          or(
            isNull(classesDrizzle.instituteId),
            eq(classesDrizzle.instituteId, instituteId),
          ),
        ),
      db
        .select({ id: subjectDbSchema.id, status: subjectDbSchema.status })
        .from(subjectDbSchema)
        .where(
          or(
            isNull(subjectDbSchema.instituteId),
            eq(subjectDbSchema.instituteId, instituteId),
          ),
        ),
      // sections belong to the institute, so they are counted directly. They
      // used to be inferred from the enrollments, which reported 0 sections
      // whenever no student had been enrolled yet.
      db
        .select({ id: sectionDrizzle.id })
        .from(sectionDrizzle)
        .where(
          and(
            eq(sectionDrizzle.instituteId, instituteId),
            eq(sectionDrizzle.status, "ACTIVE"),
          ),
        ),
    ]);

    // gender lives on the student record, not the enrollment, so it needs its
    // own pass over the enrolled students
    const studentIds = enrollmentRows.map((row) => row.studentId).filter(Boolean);
    const genderRows = studentIds.length
      ? await db
          .select({ id: student.id, gender: student.gender })
          .from(student)
          .where(inArray(student.id, studentIds))
      : [];

    const maleStudents = genderRows.filter((r) => r.gender === "MALE").length;
    const femaleStudents = genderRows.filter(
      (r) => r.gender === "FEMALE",
    ).length;

    return {
      success: true as const,
      data: {
        students: enrollmentRows.length,
        maleStudents,
        femaleStudents,
        sections: sectionRows.length,
        teachers: teacherRows.filter((r) => r.status === "ACTIVE").length,
        classes: classRows.filter((r) => r.status === "ACTIVE").length,
        subjects: subjectRows.filter((r) => r.status === "ACTIVE").length,
        ...(await getSubjectTypeSplit(instituteId)),
      } satisfies DashboardCounts,
    };
  } catch (error) {
    console.error("Failed to load dashboard counts:", error);
    return {
      success: false as const,
      error: "Failed to load dashboard counts",
      details: {},
    };
  }
}

// Setup progress for the banner. Every step is a real count — none of these is
// a stored flag, so the banner cannot drift out of sync with the data.
export type SetupSummary = {
  sessionYear: string | null;
  sessionId: string | null;
  hasClasses: boolean;
  hasTeacherAssignments: boolean;
  examsOpen: number;
};

export async function getSetupSummary() {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No user session found",
        details: {},
      };
    }
    const { instituteId } = ctx;

    const [session, classRows, assignmentRows, examRows] = await Promise.all([
      db.query.academicSessions.findFirst({
        where: eq(academicSessions.status, "ACTIVE"),
      }),
      db
        .select({ id: classesDrizzle.id })
        .from(classesDrizzle)
        .where(
          and(
            or(
              isNull(classesDrizzle.instituteId),
              eq(classesDrizzle.instituteId, instituteId),
            ),
            eq(classesDrizzle.status, "ACTIVE"),
          ),
        )
        .limit(1),
      db
        .select({ id: sectionClassTeachers.id })
        .from(sectionClassTeachers)
        .where(eq(sectionClassTeachers.instituteId, instituteId))
        .limit(1),
      db
        .select({ id: exams.id, workflow: exams.markWorkflow })
        .from(exams)
        .where(
          and(
            or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
            eq(exams.status, "ACTIVE"),
          ),
        ),
    ]);

    return {
      success: true as const,
      data: {
        sessionYear: session?.year ?? null,
        sessionId: session?.id ?? null,
        hasClasses: classRows.length > 0,
        hasTeacherAssignments: assignmentRows.length > 0,
        examsOpen: examRows.filter((row) => row.workflow === "OPEN").length,
      } satisfies SetupSummary,
    };
  } catch (error) {
    console.error("Failed to load setup summary:", error);
    return {
      success: false as const,
      error: "Failed to load setup summary",
      details: {},
    };
  }
}

// Distinct subjects that already have at least one mark recorded for each exam.
// Only derivable once marks exist — an exam with no entries honestly shows 0.
async function getPaperCounts(examIds: string[], instituteId: string) {
  if (examIds.length === 0) return {} as Record<string, number>;

  try {
    const rows = await db
      .selectDistinct({
        examId: examMarks.examId,
        subjectId: examMarks.subjectId,
      })
      .from(examMarks)
      .where(
        and(
          eq(examMarks.instituteId, instituteId),
          inArray(examMarks.examId, examIds),
        ),
      );

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.examId] = (acc[row.examId] ?? 0) + 1;
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to load paper counts:", error);
    return {} as Record<string, number>;
  }
}

// One bar per class: how many subjects and students it holds. Both are real
// aggregates, unlike the fabricated month-by-month growth series this replaces.
export type ClassDistributionRow = {
  classId: string;
  className: string;
  subjects: number;
  students: number;
};

export async function getClassDistribution() {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No user session found",
        details: {},
      };
    }
    const { instituteId } = ctx;

    const [assignments, classRows, enrollmentRows] = await Promise.all([
      db
        .select({
          classId: subjectAssignSchema.classId,
          status: subjectAssignSchema.status,
        })
        .from(subjectAssignSchema)
        .where(
          or(
            isNull(subjectAssignSchema.instituteId),
            eq(subjectAssignSchema.instituteId, instituteId),
          ),
        ),
      db
        .select({ id: classesDrizzle.id, name: classesDrizzle.name })
        .from(classesDrizzle)
        .where(
          or(
            isNull(classesDrizzle.instituteId),
            eq(classesDrizzle.instituteId, instituteId),
          ),
        ),
      db
        .select({
          classId: enrollments.classId,
          status: enrollments.status,
        })
        .from(enrollments)
        .where(eq(enrollments.instituteId, instituteId)),
    ]);

    const data: ClassDistributionRow[] = classRows.map((cls) => ({
      classId: cls.id,
      className: cls.name,
      subjects: assignments.filter(
        (a) => a.classId === cls.id && a.status === "ACTIVE",
      ).length,
      students: enrollmentRows.filter(
        (e) => e.classId === cls.id && e.status === "ACTIVE",
      ).length,
    }));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load class distribution:", error);
    return {
      success: false as const,
      error: "Failed to load class distribution",
      details: {},
    };
  }
}

// Distribution of the institute's exams across the mark workflow. Every exam
// sits in exactly one bucket, so this is always honest and always totals.
export type ExamWorkflowRow = {
  workflow: string;
  count: number;
};

export async function getExamWorkflowSummary() {
  try {
    const result = await readMany({
      drizzleSchema: exams,
      query: ({ db, instituteId }) =>
        db
          .select({ workflow: exams.markWorkflow })
          .from(exams)
          .where(
            and(
              or(
                isNull(exams.instituteId),
                eq(exams.instituteId, instituteId),
              ),
              eq(exams.status, "ACTIVE"),
            ),
          ),
    });

    if (!result.success) {
      return {
        success: false as const,
        error: "Failed to load exam summary",
        details: {},
      };
    }

    const rows = (result.data ?? []) as { workflow: string }[];
    const order = ["OPEN", "FINALIZED", "PUBLISHED"];
    const data: ExamWorkflowRow[] = order.map((workflow) => ({
      workflow,
      count: rows.filter((row) => row.workflow === workflow).length,
    }));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load exam summary:", error);
    return {
      success: false as const,
      error: "Failed to load exam summary",
      details: {},
    };
  }
}

// Recent exams for the table. Deliberately omits any average or pass
// percentage: those are per-exam computations, not cheap list aggregates, and
// inventing them is how the previous table ended up wrong.
export type RecentExamRow = {
  id: string;
  name: string;
  workflow: string;
  classCount: number;
  paperCount: number;
  sessionYear: string | null;
  createdAt: Date;
};

export async function getRecentExams() {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No user session found",
        details: {},
      };
    }

    const result = await readMany({
      drizzleSchema: exams,
      query: ({ db, instituteId }) =>
        db.query.exams.findMany({
          where: and(
            or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
            eq(exams.status, "ACTIVE"),
          ),
          with: {
            assignClasses: true,
            session: true,
          },
          orderBy: [desc(exams.createdAt)],
          limit: 5,
        }),
    });

    if (!result.success) {
      return {
        success: false as const,
        error: "Failed to load recent exams",
        details: {},
      };
    }

    const rows = (result.data ?? []) as {
      id: string;
      name: string;
      markWorkflow: string;
      createdAt: Date;
      assignClasses?: unknown[];
      session?: { year?: string | null } | null;
    }[];

    // papers per exam: one mark template per subject assigned to each class
    const paperCounts = await getPaperCounts(
      rows.map((exam) => exam.id),
      ctx.instituteId,
    );

    const data: RecentExamRow[] = rows.map((exam) => ({
      id: exam.id,
      name: exam.name,
      workflow: exam.markWorkflow,
      classCount: exam.assignClasses?.length ?? 0,
      paperCount: paperCounts[exam.id] ?? 0,
      sessionYear: exam.session?.year ?? null,
      createdAt: exam.createdAt,
    }));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load recent exams:", error);
    return {
      success: false as const,
      error: "Failed to load recent exams",
      details: {},
    };
  }
}

// ============================================================ publish state

// Workflow + published timestamp for every active exam. The monitoring summary
// carries progress but not lifecycle, and "complete but not published" is the
// single most valuable thing the dashboard can tell an admin, so the two are
// joined in the page rather than guessed.
export type ExamPublishStateRow = {
  id: string;
  name: string;
  workflow: string;
  sessionYear: string | null;
  publishedAt: Date | null;
};

export async function getExamPublishState() {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No user session found",
        details: {},
      };
    }

    const rows = await db
      .select({
        id: exams.id,
        name: exams.name,
        workflow: exams.markWorkflow,
        sessionYear: academicSessions.year,
        publishedAt: exams.publishedAt,
      })
      .from(exams)
      .leftJoin(academicSessions, eq(academicSessions.id, exams.sessionId))
      .where(
        and(
          // exams are global defaults too, which is why monitoring.action.ts
          // matches them the same way
          or(isNull(exams.instituteId), eq(exams.instituteId, ctx.instituteId)),
          eq(exams.status, "ACTIVE"),
        ),
      );

    return {
      success: true as const,
      data: rows satisfies ExamPublishStateRow[],
    };
  } catch (error) {
    console.error("Failed to load exam publish state:", error);
    return {
      success: false as const,
      error: "Failed to load exam publish state",
      details: {},
    };
  }
}

// ========================================================= staff coverage

// How many sections exist and how many have a class teacher this session.
// A section with no class teacher has nobody accountable for it, which is a
// staffing gap rather than a data gap — so it belongs on the dashboard.
export type SectionCoverage = {
  sections: number;
  withClassTeacher: number;
  withoutClassTeacher: number;
};

export async function getSectionCoverage() {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No user session found",
        details: {},
      };
    }
    const { instituteId } = ctx;

    const [sectionRows, assignmentRows] = await Promise.all([
      db
        .select({ id: sectionDrizzle.id })
        .from(sectionDrizzle)
        .where(
          and(
            eq(sectionDrizzle.instituteId, instituteId),
            eq(sectionDrizzle.status, "ACTIVE"),
          ),
        ),
      db
        .select({ sectionId: sectionClassTeachers.sectionId })
        .from(sectionClassTeachers)
        .where(
          and(
            eq(sectionClassTeachers.instituteId, instituteId),
            eq(sectionClassTeachers.status, "ACTIVE"),
          ),
        ),
    ]);

    const covered = new Set(assignmentRows.map((row) => row.sectionId));
    const withClassTeacher = sectionRows.filter((row) =>
      covered.has(row.id),
    ).length;

    return {
      success: true as const,
      data: {
        sections: sectionRows.length,
        withClassTeacher,
        withoutClassTeacher: sectionRows.length - withClassTeacher,
      } satisfies SectionCoverage,
    };
  } catch (error) {
    console.error("Failed to load section coverage:", error);
    return {
      success: false as const,
      error: "Failed to load section coverage",
      details: {},
    };
  }
}

// ========================================================= exam progress

// Paper-level progress: how many class × subject papers an exam has, and how
// many of them already hold at least one mark.
//
// The dashboard used to call getExamMonitoringSummaries for this. That action
// resolves section × subject "units" with a per-exam batch of queries — right
// for the exam page, wrong here: every query serialises on one pooled
// connection, and the dashboard render went past 10s. These five grouped
// queries cover all exams at once, need no admin role, and answer the only
// question the dashboard asks.
export type ExamProgressRow = {
  id: string;
  name: string;
  sessionYear: string | null;
  workflow: string;
  assignedClasses: number;
  papers: number;
  papersEntered: number;
  pendingRequests: number;
};

export async function getExamProgress() {
  try {
    const ctx = await getUserContext();
    if (!ctx) {
      return {
        success: false as const,
        error: "No user session found",
        details: {},
      };
    }
    const { instituteId } = ctx;

    const [examRows, classRows, assignmentRows, markRows, requestRows] =
      await Promise.all([
        db
          .select({
            id: exams.id,
            name: exams.name,
            workflow: exams.markWorkflow,
            sessionYear: academicSessions.year,
          })
          .from(exams)
          .leftJoin(academicSessions, eq(academicSessions.id, exams.sessionId))
          .where(
            and(
              or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
              eq(exams.status, "ACTIVE"),
            ),
          ),
        db
          .select({ examId: examClasses.examId, classId: examClasses.classId })
          .from(examClasses)
          .where(
            and(
              eq(examClasses.status, "ACTIVE"),
              or(
                isNull(examClasses.instituteId),
                eq(examClasses.instituteId, instituteId),
              ),
            ),
          ),
        db
          .select({
            classId: subjectAssignSchema.classId,
            subjectId: subjectAssignSchema.subjectId,
          })
          .from(subjectAssignSchema)
          .where(
            and(
              eq(subjectAssignSchema.status, "ACTIVE"),
              or(
                isNull(subjectAssignSchema.instituteId),
                eq(subjectAssignSchema.instituteId, instituteId),
              ),
            ),
          ),
        db
          .selectDistinct({
            examId: examMarks.examId,
            classId: enrollments.classId,
            subjectId: examMarks.subjectId,
          })
          .from(examMarks)
          .innerJoin(enrollments, eq(enrollments.id, examMarks.enrollmentId))
          .where(
            and(
              eq(examMarks.instituteId, instituteId),
              eq(examMarks.status, "ACTIVE"),
            ),
          ),
        db
          .select({ examId: examMarkEditRequests.examId })
          .from(examMarkEditRequests)
          .where(
            and(
              eq(examMarkEditRequests.instituteId, instituteId),
              eq(examMarkEditRequests.status, "PENDING"),
            ),
          ),
      ]);

    // subjects assigned per class, so an exam's paper count is
    // (its classes) × (the subjects each of those classes carries)
    const subjectsByClass = new Map<string, Set<string>>();
    for (const row of assignmentRows) {
      const set = subjectsByClass.get(row.classId) ?? new Set<string>();
      set.add(row.subjectId);
      subjectsByClass.set(row.classId, set);
    }

    const data: ExamProgressRow[] = examRows.map((exam) => {
      const classes = classRows
        .filter((row) => row.examId === exam.id)
        .map((row) => row.classId);

      const papers = new Set<string>();
      for (const classId of classes) {
        for (const subjectId of subjectsByClass.get(classId) ?? []) {
          papers.add(`${classId}:${subjectId}`);
        }
      }

      const entered = new Set(
        markRows
          .filter((row) => row.examId === exam.id)
          .map((row) => `${row.classId}:${row.subjectId}`)
          .filter((key) => papers.has(key)),
      );

      return {
        id: exam.id,
        name: exam.name,
        sessionYear: exam.sessionYear ?? null,
        workflow: exam.workflow,
        assignedClasses: classes.length,
        papers: papers.size,
        papersEntered: entered.size,
        pendingRequests: requestRows.filter((row) => row.examId === exam.id)
          .length,
      };
    });

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to load exam progress:", error);
    return {
      success: false as const,
      error: "Failed to load exam progress",
      details: {},
    };
  }
}
