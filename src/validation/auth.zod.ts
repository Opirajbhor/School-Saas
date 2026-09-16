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
  phone: z
    .number()
    .min(11, "Number is too short")
    .max(11, "Number is too long"),

  division: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  district: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  upazila: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
});
export type InstituteInput = z.infer<typeof instituteZod>;
export type InstituteOutput = InstituteInput & {
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
