import { z } from "zod";

// export const defaultMarkZod = createInsertSchema(subjectMarkTemplates);
// payload sent from the mark-input modal: one subject + every mark type the
// subject was enabled for (disabled / zero-mark rows are filtered out client side).
export const defaultMarkZod = z.object({
  subjectId: z.string().uuid(),
  subjectName: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  marks: z
    .array(
      z.object({
        markTypeId: z.string().uuid(),
        fullMark: z.coerce.number().min(0).max(100),
        passMark: z.coerce.number().min(0),
      }),
    )
    .min(1, { error: "Enable at least one mark type" }),
});
export type InputDefaultMarkType = z.input<typeof defaultMarkZod>;
export type OutputDefaultMarkType = z.infer<typeof defaultMarkZod>;

// one `subject_mark_templates` row — this is what the DB insert validates.
export const subjectMarkTemplateRowZod = z
  .object({
    subjectId: z.string().uuid(),
    markTypeId: z.string().uuid(),
    fullMark: z.coerce.number().int().min(0).max(100),
    passMark: z.coerce.number().int().min(0),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .refine((row) => row.passMark <= row.fullMark, {
    error: "Pass mark cannot be greater than full mark",
    path: ["passMark"],
  });
export type InputSubjectMarkTemplateRowType = z.input<
  typeof subjectMarkTemplateRowZod
>;
export type OutputSubjectMarkTemplateRowType = z.infer<
  typeof subjectMarkTemplateRowZod
>;

export type OutputDefaultMarkTypes = {
  id: string;
  name: string;
  code: string;
  shortName: string;
  status: "ACTIVE" | "INACTIVE";
  instituteId: string | null;
  markTemplates: {
    id: string;
    fullMark: number;
    passMark: number;
    markType: { id: string; name: string };
  }[];
};
