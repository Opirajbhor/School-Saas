import z from "zod";

// "10:30" — the routine dialog and the print sheet both speak 24h times, and
// the DB column is a `time`, so the shape is fixed here rather than trusted
// from the browser.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const examRoutineSlotZod = z
  .object({
    id: z.uuid().optional(),
    examId: z.uuid(),
    classId: z.uuid(),
    sectionId: z.uuid().nullish(),
    subjectId: z.uuid(),
    kind: z.enum(["THEORY", "PRACTICAL"]),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      error: "Pick a date",
    }),
    startsAt: z.string().regex(TIME, { error: "Start time is required" }),
    endsAt: z.string().regex(TIME, { error: "End time is required" }),
    note: z.string().trim().max(120).nullish(),
  })
  .refine((slot) => slot.endsAt > slot.startsAt, {
    error: "The paper cannot end before it starts",
    path: ["endsAt"],
  });

export type InputExamRoutineSlotType = z.infer<typeof examRoutineSlotZod>;

export const examRoutineQueryZod = z.object({ examId: z.uuid() });
export const examRoutineIdZod = z.uuid();

// Copying is the routine's main shortcut: the same paper is usually sat by
// several classes on one day, and a whole day is often shifted by a week.
export const copySlotZod = z.object({
  slotId: z.uuid(),
  classIds: z.array(z.uuid()).min(1, { error: "Pick at least one class" }),
});

export const copyDayZod = z.object({
  examId: z.uuid(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Pick a date" }),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Pick a date" }),
});

export type InputCopySlotType = z.infer<typeof copySlotZod>;
export type InputCopyDayType = z.infer<typeof copyDayZod>;

// Adding one paper to several classes in a single pass: the same subject, date
// and time, one row per class. Classes that do not study the subject are
// reported back as skipped rather than failing the whole save.
export const multiSlotZod = examRoutineSlotZod.and(
  z.object({
    classIds: z.array(z.uuid()).min(1, { error: "Pick at least one class" }),
  }),
);

export type InputMultiSlotType = z.infer<typeof multiSlotZod>;

// The instructions printed under the routine. Empty is valid: clearing the
// field removes the block from the sheet.
export const routineNoticeZod = z.object({
  examId: z.uuid(),
  notice: z
    .string()
    .max(1200, { error: "Keep the notice under 1200 characters" })
    .default(""),
});

export type InputRoutineNoticeType = z.infer<typeof routineNoticeZod>;
