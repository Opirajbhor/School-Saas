import {
  examClasses,
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  exams,
} from "@/src/drizzle-DB/schema";
import { sectionType } from "@/src/validation/classes.zod";
import { OutputStudentType } from "@/src/validation/student.zod";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

//=========== exam create ==========

export const examZod = createInsertSchema(exams, {
  name: (schema) => schema.min(1, { error: "name  is required" }),
}).omit({
  instituteId: true,
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

// -------------------mark input (exam × class × section × subject) ------------

export const examMarkColumnsZod = z.object({
  examId: z.uuid("Invalid exam id"),
  classId: z.uuid("Invalid class id"),
  sectionId: z.uuid("Invalid section id"),
  subjectId: z.uuid("Invalid subject id"),
});
export type InputExamMarkColumnsType = z.infer<typeof examMarkColumnsZod>;

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

export type MarkEntryStatus = "PENDING" | "SUBMITTED";

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
