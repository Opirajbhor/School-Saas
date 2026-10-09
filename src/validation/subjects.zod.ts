import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { subjectAssignSchema, subjectDbSchema } from "../drizzle-DB/schema";
import { classesType } from "./classes.zod";

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
});

export type InputSubjectType = z.infer<typeof inputSubjectZod>;
export type OutputSubjectType = InputSubjectType & {
  id: string;
  instituteId: string | null;
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
    subjects: OutputSubjectType[];
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
  subjectType: string;
  isOptional: boolean;
  isReligion: boolean;
};
