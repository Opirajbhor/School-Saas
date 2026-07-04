import { z } from "zod";
export const classesZod = z.object({
  instituteId: z
    .string()
    .uuid("Invalid institute ID")
    .optional()
    .or(z.literal("")),
  userId: z.string().optional(),
  name: z.string().trim().min(1, "class name is required").max(100),
  sessionId: z.string({
    message: "Session is required",
  }),
  isActive: z.boolean({
    message: "Status is required",
  }),
});

export type classesType = z.infer<typeof classesZod>;

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

export type sectionType = z.infer<typeof sectionZod>;
