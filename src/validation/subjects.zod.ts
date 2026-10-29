import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { subjectAssignSchema, subjectDbSchema } from "../drizzle-DB/schema";
import { classesType } from "./classes.zod";
import { OutputExamMarkTypes } from "@/app/super-admin/(main)/exam/_schema/exam.zod";
import { InferSelectModel } from "drizzle-orm";

export const religionEnumValues = [
  "ISLAM",
  "HINDUISM",
  "CHRISTIANITY",
  "BUDDHISM",
  "OTHER",
] as const;

export const statusEnumValues = ["ACTIVE", "INACTIVE"] as const;
export const subjectTypeEnum = [
  "COMPULSORY",
  "GROUP_BASED",
  "RELIGION",
] as const;

export const inputSubjectZod = createInsertSchema(subjectDbSchema).omit({
  id: true,
  instituteId: true,
  combineWith: true,
  combineLabel: true,
});

// -------- combining two papers (English 1st + 2nd) --------
// display only: the papers stay individual subjects everywhere else.
export const combineSubjectsZod = z.object({
  // the first paper — becomes the anchor of the pair
  firstSubjectId: z.uuid("Invalid first subject id"),
  // the second paper — points back at the anchor
  secondSubjectId: z.uuid("Invalid second subject id"),
  // what the pair is called when shown together, e.g. "English"
  label: z.string().trim().min(1, "Label is required").max(100),
});
export type InputCombineSubjectsType = z.infer<typeof combineSubjectsZod>;

export const uncombineSubjectZod = z.object({
  subjectId: z.uuid("Invalid subject id"),
});
export type InputUncombineSubjectType = z.infer<typeof uncombineSubjectZod>;

export type InputSubjectType = z.infer<typeof inputSubjectZod>;
export type OutputSubjectType = InputSubjectType & {
  id: string;
  instituteId: string | null;
  combineWith: string | null;
  combineLabel: string | null;
};

// --------------subject assign zod validation----------------
export const subjectAssignmentZod = createInsertSchema(subjectAssignSchema)
  .omit({
    subjectId: true,
    id: true,
    instituteId: true,
  })
  .extend({
    subjectIds: z.array(z.string().uuid("Invalid subject id")),
  });
export type inputSubAssignType = z.input<typeof subjectAssignmentZod>;

export type ClassSubjectsType = classesType &
  {
    id: string;
    subject: {
      id: string;
      name: string;
    };
    markTypes: OutputExamMarkTypes[];
    subject_type: string;
  }[];

// subject assignment

export type RawSubjectAssignment = {
  id: string;
  className: string;
  groupName: string;
  subject:
    | {
        id: string;
        name: string;
        isOptional: boolean;
        isReligion: boolean;
        subjectType: string;
      }[]
    | null;
};

export type OutputSubAssignType = {
  id: string;
  className: string;
  groupName: string;
  subjectName: string;
  subject_type: string;
  isOptional: boolean;
  isReligion: boolean;
};

// ===============table type ===============
export type ClassesSubjectsType = InferSelectModel<
  typeof subjectAssignSchema
> & {
  subject: InferSelectModel<typeof subjectDbSchema> | null;
};

// subjects.zod.ts — Fixed: align the row type with reality
export type ClassSubjectRowType = {
  id: string;
  classId: string;
  groupId: string | null;
  subjectId: string;
  subject_type: string;
  isOptional: boolean;
  isReligion: boolean;
  status: "ACTIVE" | "INACTIVE";
  subject: {
    id: string;
    name: string;
    code: string;
    shortName: string | null;
  } | null;
  markTypes: {
    id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
  }[];
};

export type ClassWithSubjectsType = ClassSubjectRowType;
