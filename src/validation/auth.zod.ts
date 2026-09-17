import { z } from "zod";

// ==============step-1 user account creation===============
export const signUpZod = z
  .object({
    name: z
      .string()
      .min(5, "UserName must be at least 5 characters")
      .max(100, "UserName must be between 100 characters"),
    email: z.string().email("Please enter a valid email address"),
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
export type SignUpType = z.infer<typeof signUpZod>;

// ==============step-2 institute profile creation===============

export const instituteZod = z.object({
  eiin: z
    .string()
    .min(6, "EIIN must be at least 6 characters")
    .max(6, "EIIN must be at least 6 characters"),
  nameBangla: z
    .string()
    .min(10, "Bangla Name is too short")
    .max(200, "Bangla Name is too long"),
  nameEnglish: z
    .string()
    .min(10, "English Name is too short")
    .max(200, "English Name is too long"),
  phone: z.string().max(11, "Number is too long"),

  logo: z.string().nullable(),
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  upazila: z.string().min(1, "Upazila is required"),
});
export type InstituteInput = z.infer<typeof instituteZod>;
export type InstituteOutput = InstituteInput & {
  id: string;
};

// ================ step-3 admin profile ===============
export const adminProfileZod = z.object({
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
});
export type AdminProfileInput = z.infer<typeof adminProfileZod>;
export type AdminProfileOutput = AdminProfileInput & {
  id: string;
};

// =============== Login Zod ==================
export const logInZod = z.object({
  email: z.string().email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      "Password must contain uppercase, lowercase and number",
    ),
});

export type LogInType = z.infer<typeof logInZod>;

export type ProfileType = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  eiin: string;
  instituteNameBangla: string;
  instituteNameEnglish: string;
  adminNameBangla: string;
  adminNameEnglish: string;
  adminDesignation: string;
  adminPhone: string;
  division: string;
  district: string;
  upazila: string;
};
