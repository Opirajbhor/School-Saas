import z from "zod";

export const TICKET_CATEGORIES = [
  "ACADEMIC",
  "EXAM",
  "RESULT",
  "ATTENDANCE",
  "BILLING",
  "TECHNICAL",
  "OTHER",
] as const;

export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

const attachmentZod = z.object({
  url: z.string().min(1),
  name: z.string().min(1).max(200),
  mime: z.string().max(100).optional(),
  size: z.number().int().nonnegative().optional(),
});

export const createTicketZod = z.object({
  subject: z
    .string()
    .trim()
    .min(4, { error: "Give the ticket a subject" })
    .max(140, { error: "Keep the subject under 140 characters" }),
  description: z
    .string()
    .trim()
    .min(10, { error: "Describe the problem in at least 10 characters" })
    .max(4000),
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES),
  /** a teacher always opens at institute scope; an admin may address superadmin */
  scope: z.enum(["INSTITUTE", "PLATFORM"]).default("INSTITUTE"),
  attachments: z.array(attachmentZod).max(5).default([]),
});

export type InputCreateTicketType = z.infer<typeof createTicketZod>;

export const replyTicketZod = z.object({
  ticketId: z.uuid(),
  body: z.string().trim().min(1, { error: "Write a reply" }).max(4000),
  isInternal: z.boolean().default(false),
  attachments: z.array(attachmentZod).max(5).default([]),
});

export type InputReplyTicketType = z.infer<typeof replyTicketZod>;

export const changeStatusZod = z.object({
  ticketId: z.uuid(),
  status: z.enum(TICKET_STATUSES),
});

export const assignTicketZod = z.object({
  ticketId: z.uuid(),
  /** null clears the assignment */
  assigneeId: z.string().min(1).nullable(),
});

export const ticketFilterZod = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["ALL", ...TICKET_STATUSES]).default("ALL"),
  priority: z.enum(["ALL", ...TICKET_PRIORITIES]).default("ALL"),
  category: z.enum(["ALL", ...TICKET_CATEGORIES]).default("ALL"),
  scope: z.enum(["ALL", "INSTITUTE", "PLATFORM"]).default("ALL"),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(50).default(10),
});

export type InputTicketFilterType = z.infer<typeof ticketFilterZod>;

// labels the UI reuses
export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ACADEMIC: "Academic",
  EXAM: "Exam",
  RESULT: "Result",
  ATTENDANCE: "Attendance",
  BILLING: "Billing",
  TECHNICAL: "Technical",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
