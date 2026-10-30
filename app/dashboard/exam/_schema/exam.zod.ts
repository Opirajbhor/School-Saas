import {
  examClasses,
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  exams,
} from "@/src/drizzle-DB/schema";
import { sectionType, compareClassName } from "@/src/validation/classes.zod";
import { OutputStudentType } from "@/src/validation/student.zod";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

//=========== exam create ==========

export const examZod = createInsertSchema(exams, {
  name: (schema) => schema.min(1, { error: "name  is required" }),
}).omit({
  instituteId: true,
  // the mark lock is driven by the workflow actions, never by the exam form
  markWorkflow: true,
  finalizedAt: true,
  finalizedById: true,
  publishedAt: true,
  publishedById: true,
});
export type InputExamType = z.infer<typeof examZod>;
export const outputExamZod = createSelectSchema(exams);
export type OutputExamType = z.infer<typeof outputExamZod> & {
  assignClasses: {
    classId: string;
    status: string;
    class: {
      id: string;
      name: string;
    };
  }[];
};
//=========== exam assign to class ==========

export const examAssignZod = z.object({
  examId: z.uuid("Invalid exam id"),
  classId: z.array(z.uuid("Invalid class id")),
});
export type InputExamAssignType = z.infer<typeof examAssignZod>;
export const outputExamAssignZod = createSelectSchema(examClasses);
export type OutputExamAssignType = z.infer<typeof outputExamAssignZod>;

//=========== exam mark type ==========
export const examMarkTypesZod = createInsertSchema(examMarkTypesDrizzle, {
  name: (schema) => schema.min(1, { error: "name  is required" }),
}).omit({
  instituteId: true,
});
export type InputExamMarkTypes = z.infer<typeof examMarkTypesZod>;
export const outputExamMarkTypesZod = createSelectSchema(examMarkTypesDrizzle);
export type OutputExamMarkTypes = z.infer<typeof outputExamMarkTypesZod>;

//=========== exam grade range ==========
export const examGradeRangeZod = createInsertSchema(examGradeRangeDrizzle, {
  name: (schema) => schema.min(1, { error: "name  is required" }),
  minMark: (schema) => schema.min(1, { error: "Minimum mark is required" }),
  maxMark: (schema) => schema.min(1, { error: "Maximum mark is required" }),
  GPA: (schema) => schema.min(1, { error: "GPA is required" }),
}).omit({
  instituteId: true,
});
export type InputExamGradeRangeType = z.infer<typeof examGradeRangeZod>;
export const outputExamGradeRangeZod = createSelectSchema(
  examGradeRangeDrizzle,
);
export type OutputExamGradeRangeType = z.infer<typeof examGradeRangeZod>;

// -------------------mark entry/exam overview ------------
export type ExamOverViewType = z.infer<typeof outputExamZod> & {
  assignClasses: {
    classId: string;
    status: string;
    class: {
      id: string;
      name: string;
      sections: sectionType[];
      subjects: OutputSubjectType[];
      students: OutputStudentType[];
    };
  }[];
};

/**
 * Sorts the classes assigned to an exam into academic order.
 *
 * `exam_classes` rows are inserted in the order the classes were ticked on the
 * assign form, so the database order is arbitrary and "Class 10" can land ahead
 * of "Class 6". Every screen that lists an exam's classes must sort through
 * this so the cards, badges and table cells all agree.
 */
export function sortAssignedClasses<
  T extends { class: { name?: string | null } | null },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) =>
    compareClassName({ name: a.class?.name ?? "" }, { name: b.class?.name ?? "" }),
  );
}

// -------------------mark input (exam × class × section × subject) ------------

// `exams.id` is a uuid column, so a non-uuid segment must fail validation
// instead of reaching Postgres
export const examIdZod = z.uuid("Invalid exam id");

export const examMarkColumnsZod = z.object({
  examId: z.uuid("Invalid exam id"),
  classId: z.uuid("Invalid class id"),
  sectionId: z.uuid("Invalid section id"),
  subjectId: z.uuid("Invalid subject id"),
});
export type InputExamMarkColumnsType = z.infer<typeof examMarkColumnsZod>;

// draft keeps whatever was typed; submit requires a complete sheet
export const markEntryStatusZod = z.enum(["DRAFT", "SUBMITTED"]);
export type MarkEntryStatus = z.infer<typeof markEntryStatusZod>;

// one student's row in the mark sheet
export const markInputRowZod = z
  .object({
    studentId: z.uuid("Invalid student id"),
    // absent students store no marks — the flag is what gets saved
    absent: z.boolean(),
    marks: z.array(
      z.object({
        markTypeId: z.uuid("Invalid mark type id"),
        mark: z
          .number({ error: "Mark must be a number" })
          .min(0, { error: "Mark cannot be negative" }),
      }),
    ),
  })
  .refine((row) => row.absent || row.marks.length > 0, {
    error: "Enter at least one mark or mark the student absent",
    path: ["marks"],
  });
export type InputMarkInputRowType = z.infer<typeof markInputRowZod>;

// the whole sheet — this is the react-hook-form value shape
export const markInputSheetZod = examMarkColumnsZod.extend({
  rows: z.array(markInputRowZod).min(1, { error: "No students to save" }),
});
export type InputMarkInputSheetType = z.infer<typeof markInputSheetZod>;

// the save payload adds the workflow intent to the sheet
export const saveMarkInputZod = examMarkColumnsZod.extend({
  intent: markEntryStatusZod,
  rows: z.array(markInputRowZod).min(1, { error: "No students to save" }),
});
export type InputSaveMarkInputType = z.infer<typeof saveMarkInputZod>;

// ------------------- mark entry monitoring ------------

// a monitored unit is one section × subject of a class assigned to the exam
export type MonitoringCompletionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export type MonitoringUnitType = {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  // the teacher assigned via section_subject_teachers, if any
  teacher: { id: string; nameEnglish: string } | null;
  // students eligible for this subject in this section
  eligibleStudents: number;
  // eligibleStudents × configured mark types
  requiredMarks: number;
  // cells that hold a mark or an absent flag
  enteredMarks: number;
  missingMarks: number;
  completion: number;
  entryStatus: MarkEntryStatus;
  status: MonitoringCompletionStatus;
  // a unit with no students or no mark types cannot be completed
  configured: boolean;
  pendingRequests: number;
  approvedRequests: number;
};

export type ClassMonitoringType = {
  classId: string;
  className: string;
  sections: {
    sectionId: string;
    sectionName: string;
    units: number;
    completed: number;
    completion: number;
  }[];
  units: number;
  completed: number;
  completion: number;
};

export type ExamMonitoringSummaryType = {
  examId: string;
  examName: string;
  sessionName: string | null;
  assignedClasses: number;
  units: number;
  completedUnits: number;
  completion: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  pendingRequests: number;
};

export type ExamDashboardType = {
  exam: { id: string; name: string; sessionName: string | null };
  summary: {
    totalUnits: number;
    completedUnits: number;
    incompleteUnits: number;
    unconfiguredUnits: number;
    completion: number;
    pendingRequests: number;
  };
  classes: ClassMonitoringType[];
  units: MonitoringUnitType[];
};

// student-level view of one monitored unit
export type SubjectMonitoringType = {
  exam: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  subject: { id: string; name: string };
  teacher: { id: string; nameEnglish: string } | null;
  entryStatus: MarkEntryStatus;
  markTypes: { id: string; name: string; fullMark: number }[];
  // whether the current viewer may change these marks
  canEdit: boolean;
  editRequest: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason: string;
    requestedBy: string;
    requestedAt: Date;
    resolutionNote: string | null;
    resolvedBy: string | null;
    resolvedAt: Date | null;
  } | null;
  summary: {
    eligibleStudents: number;
    requiredMarks: number;
    enteredMarks: number;
    missingMarks: number;
    absentStudents: number;
    studentsWithMissingMarks: number;
    completion: number;
  };
  students: {
    studentId: string;
    roll: string;
    englishName: string;
    banglaName: string | null;
    absent: boolean;
    entered: number;
    required: number;
    missing: number;
    complete: boolean;
    marks: { markTypeId: string; mark: number; absent: boolean }[];
  }[];
};

// ------------------- mark edit requests ------------

export const markEditRequestStatusZod = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export type MarkEditRequestStatus = z.infer<typeof markEditRequestStatusZod>;

export const markEditRequestZod = examMarkColumnsZod.extend({
  reason: z
    .string()
    .trim()
    .min(5, { error: "Give a short reason (at least 5 characters)" })
    .max(500, { error: "Reason is too long" }),
});
export type InputMarkEditRequestType = z.infer<typeof markEditRequestZod>;

export const resolveMarkEditRequestZod = z.object({
  requestId: z.uuid("Invalid request id"),
  decision: z.enum(["APPROVED", "REJECTED"]),
  resolutionNote: z
    .string()
    .trim()
    .max(500, { error: "Note is too long" })
    .optional(),
});
export type InputResolveMarkEditRequestType = z.infer<
  typeof resolveMarkEditRequestZod
>;

export type OutputMarkEditRequestType = {
  id: string;
  status: MarkEditRequestStatus;
  reason: string;
  resolutionNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  exam: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  subject: { id: string; name: string };
  requestedBy: { id: string; nameEnglish: string } | null;
  resolvedBy: { id: string; nameEnglish: string } | null;
};

export type OutputMarkEntrySheetType = {
  exam: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  subject: { id: string; name: string };
  sections: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  classTeacher: { id: string; nameEnglish: string } | null;
  markTypes: {
    id: string;
    name: string;
    fullMark: number;
    passMark: number;
  }[];
  totalMarks: number;
  // draft until this exam + subject has been submitted for the section
  entryStatus: MarkEntryStatus;
  // whether the current viewer may change these marks. Submitted marks are
  // read-only for teachers until an admin approves an edit request, and every
  // mark is read-only once the exam is finalized or published.
  canEdit: boolean;
  // why editing is blocked, when it is
  lockReason: string | null;
  markWorkflow: MarkWorkflow;
  editRequest: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason: string;
    resolutionNote: string | null;
  } | null;
  // how this subject combines with its paired paper (English 1st + 2nd).
  // display only — the two papers are still stored, entered and graded
  // separately; this just says what to show alongside the sheet.
  combined: {
    label: string;
    // the paper this sheet belongs to, 0 for the 1st, 1 for the 2nd
    position: 0 | 1;
    papers: {
      id: string;
      name: string;
      fullMark: number;
    }[];
    // one row per student, so the pair can be compared student by student.
    // `marks` is null for a paper that has no saved marks yet.
    students: {
      studentId: string;
      roll: string;
      englishName: string;
      papers: {
        id: string;
        total: number | null;
        absent: boolean;
        marks: { markTypeId: string; mark: number; absent: boolean }[];
      }[];
    }[];
  } | null;
  // status is null until this student has any saved mark row
  rows: {
    studentId: string;
    roll: string;
    englishName: string;
    banglaName: string | null;
    status: MarkEntryStatus | null;
    marks: { markTypeId: string; mark: number; absent: boolean }[];
  }[];
};

// ------------------- result calculation ------------

// the result page works on one exam + one class at a time
export const resultQueryZod = z.object({
  examId: z.uuid("Invalid exam id"),
  classId: z.uuid("Invalid class id"),
});
export type InputResultQueryType = z.infer<typeof resultQueryZod>;

// one result page: the ranked students plus anything that is missing.
// the calculation itself lives in ../_lib/result-calculator.ts.
export type OutputExamResultType = {
  exam: { id: string; name: string; markWorkflow: MarkWorkflow };
  class: { id: string; name: string };
  /** every subject that was graded, in display order */
  subjects: { id: string; name: string; fullMark: number }[];
  students: {
    enrollmentId: string;
    studentId: string;
    roll: string;
    englishName: string;
    banglaName: string | null;
    sectionId: string;
    sectionName: string;
    subjects: {
      subjectId: string;
      name: string;
      obtained: number;
      fullMark: number;
      percentage: number;
      grade: string;
      GPA: number;
      failed: boolean;
      absent: boolean;
    }[];
    totalObtained: number;
    totalFullMark: number;
    percentage: number;
    GPA: number;
    grade: string;
    passed: boolean;
    failedSubjects: string[];
    sectionRank: number;
    classRank: number;
  }[];
  // sections present in this class, so the table can be filtered
  sections: { id: string; name: string }[];
  // sections × subjects still missing marks; nothing is ranked until this is
  // empty or the admin acknowledges it
  incomplete: {
    sectionId: string;
    sectionName: string;
    subjectId: string;
    subjectName: string;
    missing: number;
    students: number;
    submitted: boolean;
  }[];
  complete: boolean;
  // true when the sheet was served from a published snapshot rather than a
  // live calculation, so the page can say the numbers are frozen
  fromSnapshot?: boolean;
  // the snapshot version being shown, when `fromSnapshot` is set
  snapshotVersion?: number;
};

// ------------------- result review & publication ------------

// the publish / unpublish / preview scope: one exam + one class at a time,
// matching resultQueryZod
export const resultSnapshotScopeZod = resultQueryZod;
export type InputResultSnapshotScopeType = z.infer<
  typeof resultSnapshotScopeZod
>;

// a frozen result sheet. `payload` is the exact OutputExamResultType that was
// calculated at publish time, so a published result never changes afterwards.
export const outputResultSnapshotZod = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  publishedAt: z.date(),
  publishedByName: z.string().nullable(),
  unpublishedAt: z.date().nullable(),
  unpublishedByName: z.string().nullable(),
  payloadHash: z.string(),
});
export type OutputResultSnapshotType = z.infer<
  typeof outputResultSnapshotZod
> & {
  payload: OutputExamResultType;
};

// what the review step needs before an admin approves: the calculated sheet
// plus whether anything is missing or looks wrong
export type PublishReadinessType = {
  /** false when at least one section × subject unit is missing marks */
  ready: boolean;
  /** units still missing marks, straight from the calculator */
  incomplete: OutputExamResultType["incomplete"];
  // calculation problems that are not simply missing marks
  problems: {
    kind: "NO_SUBJECTS" | "NO_MARKS" | "FAILED_ALL";
    studentId: string;
    studentName: string;
    roll: string;
    detail: string;
  }[];
  /** the sheet that would be frozen if the admin publishes now */
  preview: OutputExamResultType;
};

// ------------------- mark workflow (lock) ------------

export const markWorkflowZod = z.enum(["OPEN", "FINALIZED", "PUBLISHED"]);
export type MarkWorkflow = z.infer<typeof markWorkflowZod>;

export const setExamWorkflowZod = z.object({
  examId: z.uuid("Invalid exam id"),
  workflow: markWorkflowZod,
});
export type InputSetExamWorkflowType = z.infer<typeof setExamWorkflowZod>;

export type ExamMarkWorkflowType = {
  examId: string;
  workflow: MarkWorkflow;
  finalizedAt: Date | null;
  finalizedByName: string | null;
  publishedAt: Date | null;
  publishedByName: string | null;
  // surfaced so the UI can warn before locking an incomplete exam
  incompleteUnits: number;
};

// ------------------- mark corrections (audit trail) ------------

export const markCorrectionScopeZod = examMarkColumnsZod;
export type InputMarkCorrectionScopeType = z.infer<typeof markCorrectionScopeZod>;

export type OutputMarkCorrectionType = {
  id: string;
  createdAt: Date;
  // student + mark type the correction applies to
  studentId: string;
  roll: string;
  studentName: string;
  markTypeName: string;
  oldMark: number | null;
  newMark: number | null;
  oldAbsent: boolean | null;
  newAbsent: boolean | null;
  editedById: string;
  editedByName: string;
  editedByRole: string;
  approvedByName: string | null;
  reason: string | null;
};
