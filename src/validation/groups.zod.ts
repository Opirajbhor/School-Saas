import { z } from "zod";
import { statusEnumValues } from "./subjects.zod";

export const addGroupZod = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(50, "Group name must be at most 50 characters"),

  status: z.enum(statusEnumValues),
});

export type inputGroupType = z.infer<typeof addGroupZod>;

export type outputGroupType = inputGroupType & {
  id: string;
  instituteId: string;
};

// assign to class

export const assignGroupClassZod = z.object({
  groupId: z.uuid("Invalid group id"),

  classIds: z
    .array(z.uuid("Invalid class id"))
    .min(1, "Select at least one class"),
});

export type AssignGroupClassType = z.infer<typeof assignGroupClassZod>;

export type OutputGroupClassType = {
  id: string;
  instituteId: string;
  name: string;
  status: string;
  groupClasses: {
    class: {
      id: string;
      groupId: string;
      classId: string;
      name: string;
    };
    classId: string;
  }[];
};
