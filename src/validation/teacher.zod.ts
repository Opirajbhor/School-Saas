import { z } from "zod";
export const addTeacherZod = z.object({
  instituteId: z.uuid("Invalid institute ID"),
  userId: z.string().optional(),
  nameBangla: z.string().trim().min(3, "Bangla name is required").max(100),
  nameEnglish: z.string().trim().min(3, "English name is required").max(100),
  designation: z.string().trim().min(3, "Designation is required").max(100),
  mobile: z
    .string()
    .trim()
    .min(11, "Invalid mobile number")
    .max(11, "Invalid mobile number"),
  email: z.email("Invalid email address"),
  photoUrl: z.string().url("Invalid photo URL").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type addTeacherType = z.infer<typeof addTeacherZod>;
