/**
 * What the dashboard tells an admin to do next.
 *
 * Pure: every input is already fetched and institute-scoped by the caller, so
 * this module only decides ordering and wording. Keeping it out of the page
 * means the rules can be read (and tested) without a database.
 *
 * The rule this enforces: nothing on the dashboard may claim a fact the data
 * does not hold. A published exam is silent; an incomplete one says how
 * incomplete; a section with no class teacher is named as such.
 */

export type SectionCoverage = {
  sections: number;
  withClassTeacher: number;
  withoutClassTeacher: number;
};

export type SetupState = {
  sessionYear: string | null;
  hasClasses: boolean;
  hasTeacherAssignments: boolean;
};

/** One exam's mark-entry progress, as reported by the monitoring action. */
export type ExamProgress = {
  examId: string;
  examName: string;
  sessionName: string | null;
  assignedClasses: number;
  units: number;
  completedUnits: number;
  completion: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  pendingRequests: number;
  workflow: string;
};

export type AttentionSeverity = "critical" | "action" | "info";

export type AttentionItem = {
  id: string;
  severity: AttentionSeverity;
  /** short category tag shown before the title */
  tag: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

export type AttentionInput = {
  setup?: SetupState;
  exams?: ExamProgress[];
  coverage?: SectionCoverage;
};

const MAX_PER_KIND = 2;

/**
 * Ordered by what costs the school most if it is ignored:
 * setup blockers, then work that is finished but not shipped, then pending
 * approvals, then unfinished exam entry, then teacher coverage.
 */
export function buildAttentionItems({
  setup,
  exams = [],
  coverage,
}: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];

  // ---------------------------------------------------------------- blockers
  if (setup && !setup.sessionYear) {
    items.push({
      id: "no-session",
      severity: "critical",
      tag: "Setup",
      title: "No active academic session",
      detail:
        "Students, classes and exams all hang off a session year. Nothing can be enrolled until one is active.",
      href: "/dashboard/academic-sessions",
      cta: "Create session",
    });
  }

  if (setup && !setup.hasClasses) {
    items.push({
      id: "no-classes",
      severity: "critical",
      tag: "Setup",
      title: "No classes have been created",
      detail:
        "Add classes and sections before enrolling students or assigning subjects.",
      href: "/dashboard/classes",
      cta: "Add class",
    });
  }

  // ------------------------------------------- finished but not published yet
  const readyToPublish = exams.filter(
    (exam) => exam.workflow === "OPEN" && exam.status === "COMPLETED",
  );

  if (setup?.hasClasses && exams.length === 0) {
    items.push({
      id: "no-exams",
      severity: "info",
      tag: "Exam",
      title: "No exams have been created yet",
      // institutes cannot create exams — only the platform admin can
      detail:
        "Exams are created by your platform admin. They appear here as soon as one is added for your institute.",
      href: "/dashboard/exam",
      cta: "View exams",
    });
  }

  for (const exam of readyToPublish.slice(0, MAX_PER_KIND)) {
    items.push({
      id: `publish-${exam.examId}`,
      severity: "action",
      tag: "Publish",
      title: `${exam.examName} is complete but not published`,
      detail: `All ${exam.units} ${
        exam.units === 1 ? "paper is" : "papers are"
      } entered across ${exam.assignedClasses} ${
        exam.assignedClasses === 1 ? "class" : "classes"
      }. Publishing freezes the result sheets and opens the report cards.`,
      href: `/dashboard/exam/${exam.examId}`,
      cta: "Review & publish",
    });
  }

  // ------------------------------------------------ corrections waiting on you
  const withRequests = exams.filter((exam) => exam.pendingRequests > 0);
  for (const exam of withRequests.slice(0, MAX_PER_KIND)) {
    items.push({
      id: `requests-${exam.examId}`,
      severity: "action",
      tag: "Approve",
      title: `${exam.pendingRequests} mark ${
        exam.pendingRequests === 1 ? "change is" : "changes are"
      } waiting on you`,
      detail: `${exam.examName} — a teacher has asked to edit marks that were already submitted.`,
      href: `/dashboard/exam/${exam.examId}`,
      cta: "Review requests",
    });
  }

  // ------------------------------------------------------ unfinished mark entry
  const inProgress = exams.filter((exam) => exam.status === "IN_PROGRESS");
  for (const exam of inProgress.slice(0, MAX_PER_KIND)) {
    const left = 100 - exam.completion;
    items.push({
      id: `progress-${exam.examId}`,
      severity: "info",
      tag: "Marks",
      title: `${exam.examName} is ${exam.completion}% entered`,
      detail: `${exam.completedUnits} of ${exam.units} ${
        exam.units === 1 ? "paper" : "papers"
      } complete — ${left}% of the marks are still missing.`,
      href: "/dashboard/exam/mark-input",
      cta: "Continue entry",
    });
  }

  const notStarted = exams.filter(
    (exam) => exam.status === "NOT_STARTED" && exam.assignedClasses > 0,
  );
  for (const exam of notStarted.slice(0, MAX_PER_KIND)) {
    items.push({
      id: `not-started-${exam.examId}`,
      severity: "info",
      tag: "Marks",
      title: `${exam.examName} has no marks entered`,
      detail: `${exam.units} ${
        exam.units === 1 ? "paper is" : "papers are"
      } waiting across ${exam.assignedClasses} ${
        exam.assignedClasses === 1 ? "class" : "classes"
      }.`,
      href: "/dashboard/exam/mark-input",
      cta: "Start entry",
    });
  }

  // ----------------------------------------------------------- staff coverage
  if (coverage && coverage.withoutClassTeacher > 0) {
    items.push({
      id: "class-teacher-gap",
      severity: "action",
      tag: "Staffing",
      title: `${coverage.withoutClassTeacher} of ${
        coverage.sections
      } sections have no class teacher`,
      detail:
        "A section without a class teacher has nobody accountable for attendance or the report card.",
      href: "/dashboard/teacher-assignment",
      cta: "Assign teachers",
    });
  }

  if (setup && setup.hasClasses && !setup.hasTeacherAssignments) {
    items.push({
      id: "no-teacher-assignments",
      severity: "info",
      tag: "Staffing",
      title: "No subject teachers assigned",
      detail:
        "Marks entry is scoped to the teacher of each section-subject pair, so nobody can enter marks yet.",
      href: "/dashboard/teacher-assignment",
      cta: "Assign teachers",
    });
  }

  const rank: Record<AttentionSeverity, number> = {
    critical: 0,
    action: 1,
    info: 2,
  };
  return items.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** One weighted figure across every exam: completed units over all units. */
export function overallMarkProgress(exams: ExamProgress[]) {
  const units = exams.reduce((sum, exam) => sum + exam.units, 0);
  const completedUnits = exams.reduce(
    (sum, exam) => sum + exam.completedUnits,
    0,
  );
  return {
    units,
    completedUnits,
    completion: units === 0 ? 0 : Math.round((completedUnits / units) * 100),
  };
}
