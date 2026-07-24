import { z } from "zod";

export const addStudentZod = z.object({
  instituteId: z.uuid("Invalid institute id"),

  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required")
    .max(30, "Student ID cannot exceed 30 characters"),

  englishName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  fatherName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  motherName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),

  banglaName: z.string().trim().max(200, "Bangla name is too long").optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    error: "Please select a gender",
  }),

  dateOfBirth: z.coerce.date({
    error: "Invalid date of birth",
  }),

  religion: z.string().trim().max(50, "Religion is too long"),

  phone: z
    .string()
    .trim()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, "Invalid mobile number"),

  photoUrl: z.string().url("Invalid photo URL").optional(),

  birthCertificateNo: z.string().trim().max(50).optional(),

  address: z.string().trim().max(500),

  status: z
    .enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "LEFT"])
    .default("ACTIVE"),
});

export type AddStudentType = z.infer<typeof addStudentZod>;
