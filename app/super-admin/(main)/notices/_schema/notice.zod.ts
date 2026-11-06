import z from "zod";

export const NOTICE_PRIORITIES = ["NORMAL", "IMPORTANT", "URGENT"] as const;
export type NoticePriority = (typeof NOTICE_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<NoticePriority, string> = {
  NORMAL: "Normal",
  IMPORTANT: "Important",
  URGENT: "Urgent",
};

const attachmentZod = z.object({
  url: z.string().min(1),
  name: z.string().min(1).max(200),
  mime: z.string().max(100).nullish(),
  size: z.number().int().nonnegative().nullish(),
});

export const createNoticeZod = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, { error: "Give the notice a title" })
      .max(140),
    body: z
      .string()
      .trim()
      .min(10, { error: "Write the notice body" })
      .max(8000),
    priority: z.enum(NOTICE_PRIORITIES).default("NORMAL"),
    audience: z.enum(["ALL", "SELECTED"]).default("ALL"),
    instituteIds: z.array(z.uuid()).default([]),
    /** ISO datetime; a future value schedules the notice */
    publishAt: z.string().min(1, { error: "Pick a publish date" }),
    expiresAt: z.string().nullish(),
    pinned: z.boolean().default(false),
    attachments: z.array(attachmentZod).max(5).default([]),
  })
  .refine(
    (value) => value.audience === "ALL" || value.instituteIds.length > 0,
    { error: "Pick at least one institute", path: ["instituteIds"] },
  )
  .refine(
    (value) =>
      !value.expiresAt ||
      new Date(value.expiresAt).getTime() > new Date(value.publishAt).getTime(),
    { error: "Expiry must be after the publish date", path: ["expiresAt"] },
  );

export type InputCreateNoticeType = z.infer<typeof createNoticeZod>;

export const superNoticeFilterZod = z.object({
  q: z.string().trim().max(120).optional(),
  priority: z.enum(["ALL", ...NOTICE_PRIORITIES]).default("ALL"),
  status: z.enum(["ALL", "SCHEDULED", "LIVE", "ARCHIVED"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
});

export const instituteNoticeFilterZod = z.object({
  q: z.string().trim().max(120).optional(),
  priority: z.enum(["ALL", ...NOTICE_PRIORITIES]).default("ALL"),
  read: z.enum(["ALL", "UNREAD", "READ"]).default("ALL"),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
});

export type InputSuperNoticeFilterType = z.infer<typeof superNoticeFilterZod>;
export type InputInstituteNoticeFilterType = z.infer<
  typeof instituteNoticeFilterZod
>;
