import { z } from "zod";
import { statusEnumValues } from "./subjects.zod";
import { outputGroupType } from "./groups.zod";
export const classesZod = z.object({
  instituteId: z
    .string()
    .uuid("Invalid institute ID")
    .optional()
    .or(z.literal("")),
  userId: z.string().nullable().optional(),
  name: z.string().trim().min(1, "class name is required").max(100),
  sessionId: z.string({
    message: "Session is required",
  }),
  status: z.enum(statusEnumValues).default("ACTIVE"),
});

export type classesType = z.input<typeof classesZod>;

export type classesTypeWithId = classesType & {
  id?: string;
  sections?: sectionType[];
};

// section
export const sectionZod = z.object({
  instituteId: z
    .string()
    .uuid("Invalid institute ID")
    .optional()
    .or(z.literal("")),
  userId: z.string().optional(),
  name: z.string().trim().min(1, "section name is required").max(100),
  sessionId: z.string({
    message: "Session is required",
  }),
  classId: z.string({
    message: "class is required",
  }),
});

export type sectionTypeWithId = z.infer<typeof sectionZod>;

export type sectionType = sectionTypeWithId & {
  id?: string;
  status: string;
};

// for classes and nested groups in the server action-------
export type ClassesWithGroups = classesType & {
  id: string;
  groups: outputGroupType[];
};
