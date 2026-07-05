import { z } from "zod";

export const addSubjectZod = z.object({
  instituteId: z.uuid("Invalid institute id").optional().or(z.literal("")),
  sessionId: z.uuid("Invalid session id").optional().or(z.literal("")),
  name: z
    .string()
    .trim()
    .min(1, "Subject name is required")
    .max(100, "Subject name is too long"),
  code: z
    .string()
    .trim()
    .min(1, "Subject code is required")
    .max(20, "Subject code is too long"),
  isActive: z.boolean(),
});

export type AddSubjectType = z.infer<typeof addSubjectZod>;
