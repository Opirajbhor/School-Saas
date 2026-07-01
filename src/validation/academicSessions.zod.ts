import { z } from "zod";
export const academicSessionZod = z.object({
  instituteId: z
    .string()
    .uuid("Invalid institute ID")
    .optional()
    .or(z.literal("")),
  userId: z.string().optional(),

  year: z.string().trim().min(4, "Year is required").max(100),
  isActive: z.boolean({
    message: "Status is required",
  }),
});

export type academicSessionType = z.infer<typeof academicSessionZod>;

export type sessionList = {
  id: string;
  userId: string;
  instituteId: string;
  year: string;
  isActive: boolean;
};
