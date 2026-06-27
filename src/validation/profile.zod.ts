import z from "zod";

export const profileUpdateZod = z.object({
  adminNameBangla: z
    .string()
    .min(3, "প্রতিষ্ঠান প্রধানের নাম বাংলায় লিখুন  ")
    .max(100, "প্রতিষ্ঠান প্রধানের নাম বাংলায় "),
  adminNameEnglish: z
    .string()
    .min(3, "প্রতিষ্ঠান প্রধানের নাম  ইংরেজিতে লিখুন  ")
    .max(100, "প্রতিষ্ঠান প্রধানের নাম ইংরেজিতে লিখুন "),
  adminDesignation: z
    .string()
    .min(3, "প্রতিষ্ঠান প্রধানের পদবি লিখুন  ")
    .max(50, "প্রতিষ্ঠান প্রধানের পদবী লিখুন "),
  adminPhone: z
    .string()
    .min(11, "প্রতিষ্ঠানের মোবাইল নম্বর লিখুন  ")
    .max(11, "প্রতিষ্ঠানের মোবাইল নম্বর লিখুন  "),
});
export type ProfileUpdateType = z.infer<typeof profileUpdateZod>;
