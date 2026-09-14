import { z } from "zod";
export const addTeacherZod = z
  .object({
    instituteId: z
      .string()
      .uuid("Invalid institute ID")
      .optional()
      .or(z.literal("")),
    userId: z.string().nullable().optional(),
    nameBangla: z.string().trim().min(3, "Bangla name is required").max(100),
    nameEnglish: z.string().trim().min(3, "English name is required").max(100),
    designation: z.string().trim().min(3, "Designation is required").max(100),
    mobile: z
      .string()
      .trim()
      .min(11, "Invalid mobile number")
      .max(11, "Invalid mobile number"),
    email: z.string().email("Invalid email address"),
    photoUrl: z.string().url("Invalid photo URL").optional().or(z.literal("")),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        "Password must contain uppercase, lowercase and number",
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const editTeacherZod = z.object({
  id: z.string(),
  nameBangla: z.string().trim().min(3, "Bangla name is required").max(100),
  nameEnglish: z.string().trim().min(3, "English name is required").max(100),
  designation: z.string().trim().min(3, "Designation is required").max(100),
  mobile: z
    .string()
    .trim()
    .min(11, "Invalid mobile number")
    .max(11, "Invalid mobile number"),
  email: z.string().email("Invalid email address"),
  photoUrl: z.string().url("Invalid photo URL").optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type addTeacherType = z.infer<typeof addTeacherZod>;
export type editTeacherType = z.infer<typeof editTeacherZod>;

export type Teacherlist = {
  id: string;
  instituteId: string;
  userId: string | null;
  nameBangla: string;
  nameEnglish: string;
  designation: string;
  mobile: string;
  email: string;
  photoUrl: string | "";
  gender: "MALE" | "FEMALE" | "OTHER";
  status: "ACTIVE" | "INACTIVE";
};

export type TeacherStatsResponse = {
  success: boolean;
  data?: {
    totalTeachers: number;
    activeTeachers: number;
    maleTeachers: number;
    femaleTeachers: number;
  };
  error?: string;
};
