import { z } from "zod";

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
  "OPTIONAL",
] as const;

export const inputSubjectZod = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Subject name is required")
      .max(100, "Subject name must be at most 100 characters")
      .toUpperCase(),
    shortName: z
      .string()
      .trim()
      .min(1, "Subject short name is required")
      .max(50, "Subject short name must be at most 50 characters")
      .toUpperCase(),
    code: z
      .string()
      .trim()
      .min(1, "Subject code is required")
      .max(20, "Subject code must be at most 20 characters")
      .toUpperCase(),
    isReligion: z.boolean().default(false),
    religion: z.enum(religionEnumValues).nullable().optional(),
    status: z.enum(statusEnumValues).default("ACTIVE"),
  })
  .superRefine((data, ctx) => {
    if (data.isReligion && !data.religion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Religion selection is required when 'isReligion' is enabled",
        path: ["religion"],
      });
    }
  });

export type inputSubjectType = z.input<typeof inputSubjectZod>;

export type outputSubjectType = inputSubjectType & {
  id: string;
  instituteId: string;
};

// subject assign zod validation
export const subjectAssignmentZod = z.object({
  classId: z.uuid("Invalid class id"),
  groupId: z.uuid("Invalid group id").nullable(),
  subjectIds: z
    .array(z.uuid("Invalid subject id"))
    .min(1, "Select at least one subject"),
  subjectType: z.enum(subjectTypeEnum).default("COMPULSORY"),
  status: z.enum(statusEnumValues).default("ACTIVE"),
});

export type inputSubAssignType = z.input<typeof subjectAssignmentZod>;

export type RawSubjectAssignment = {
  id: string;
  instituteId: string;
  sessionId: string;
  classId: string;
  groupId: string;
  subjectId: string;
  subjectType: "COMPULSORY" | "GROUP_BASED" | "OPTIONAL" | null;
  status: "ACTIVE" | "INACTIVE";
  class: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
};

export type OutputSubAssignType = inputSubAssignType & {
  id: string;
  instituteId: string;
  sessionId: string;
  subjectName: string;
  groupName: string;
  className: string;
  subjectId: string;
};

