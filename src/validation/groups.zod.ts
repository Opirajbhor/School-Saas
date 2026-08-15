import { z } from "zod";

export const addGroupZod = z.object({
  instituteId: z
    .string()
    .uuid("Invalid institute ID")
    .optional()
    .or(z.literal("")),
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(50, "Group name must be at most 50 characters"),

  status: z.boolean(),
});

export type inputGroupType = z.infer<typeof addGroupZod>;

export type outputGroupType = inputGroupType & {
  id: string;
};

// assign to class

export const assignGroupClassZod = z.object({
  groupId: z.uuid("Invalid group id"),

  classIds: z
    .array(z.uuid("Invalid class id"))
    .min(1, "Select at least one class"),
});

export type AssignGroupClassType = z.infer<typeof assignGroupClassZod>;
