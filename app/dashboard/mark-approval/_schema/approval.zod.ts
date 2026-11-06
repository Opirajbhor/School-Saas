import z from "zod";

/** Filters for the institute's mark-approval table (URL-driven). */
export const submissionFilterZod = z.object({
  q: z.string().trim().max(120).optional(),
  examId: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  status: z
    .enum(["ALL", "PENDING", "APPROVED", "REJECTED", "REOPENED"])
    .default("ALL"),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z
    .enum(["submitted", "exam", "section", "subject", "status", "count"])
    .default("submitted"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
});

export type InputSubmissionFilter = z.infer<typeof submissionFilterZod>;
