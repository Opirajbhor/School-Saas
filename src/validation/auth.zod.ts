import { z } from "zod";

export const signUpZod = z
  .object({
    eiin: z
      .string()
      .min(6, "০৬ সংখ্যার ইআইআইএন (EIIN) নম্বরটি লিখুন ")
      .max(6, "০৬ সংখ্যার ইআইআইএন (EIIN) নম্বরটি লিখুন"),
    institute_name_bangla: z
      .string()
      .min(10, "আপনার শিক্ষা প্রতিষ্ঠানের নাম বাংলায় লিখুন ")
      .max(200, "আপনার শিক্ষা প্রতিষ্ঠানের নাম বাংলায় লিখুন"),
    institute_name_english: z
      .string()
      .min(10, "আপনার শিক্ষা প্রতিষ্ঠানের নাম ইংরেজিতে লিখুন ")
      .max(200, "আপনার শিক্ষা প্রতিষ্ঠানের নাম ইংরেজিতেলিখুন"),
    admin_name_bangla: z
      .string()
      .min(3, "প্রতিষ্ঠান প্রধানের নাম বাংলায় লিখুন  ")
      .max(100, "প্রতিষ্ঠান প্রধানের নাম বাংলায় "),
    admin_name_english: z
      .string()
      .min(3, "প্রতিষ্ঠান প্রধানের নাম  ইংরেজিতে লিখুন  ")
      .max(100, "প্রতিষ্ঠান প্রধানের নাম ইংরেজিতে লিখুন "),
    admin_designation: z
      .string()
      .min(3, "প্রতিষ্ঠান প্রধানের পদবি লিখুন  ")
      .max(50, "প্রতিষ্ঠান প্রধানের পদবী লিখুন "),
    admin_phone: z
      .string()
      .min(11, "প্রতিষ্ঠানের মোবাইল নম্বর লিখুন  ")
      .max(11, "প্রতিষ্ঠানের মোবাইল নম্বর লিখুন  "),

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
