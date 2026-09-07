import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { subjectDbSchema } from "../db/schema";

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

export const inputSubjectZod = createInsertSchema(subjectDbSchema).omit({
  id: true,
  instituteId: true,
});

export type InputSubjectType = z.infer<typeof inputSubjectZod>;
export type OutputSubjectType = InputSubjectType & {
  id: string;
};

// --------------subject assign zod validation----------------
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
