import { z } from "zod";

// export const defaultMarkZod = createInsertSchema(subjectMarkTemplates);
export const defaultMarkZod = z.object({
  subjectid: z.string().uuid(),
  subjectName: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  marks: z.array(
    z.object({
      markTypeId: z.string().uuid(),
      fullMark: z.coerce.number().min(0).max(100),
      passMark: z.coerce.number().min(0),
    }),
  ),
});
export type InputDefaultMarkType = z.input<typeof defaultMarkZod>;
export type OutputDefaultMarkType = z.infer<typeof defaultMarkZod>;

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
