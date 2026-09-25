import {
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
} from "@/src/drizzle-DB/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

//=========== exam mark type ==========
export const examMarkTypesZod = createInsertSchema(examMarkTypesDrizzle).omit({
  instituteId: true,
});
export type InputExamMarkTypes = z.infer<typeof examMarkTypesZod>;
export const outputExamMarkTypesZod = createSelectSchema(examMarkTypesDrizzle);
export type OutputExamMarkTypes = z.infer<typeof outputExamMarkTypesZod>;

//=========== exam mark type ==========
export const examGradeRangeZod = createInsertSchema(examGradeRangeDrizzle);
export type InputExamGradeRangeType = z.infer<typeof examGradeRangeZod>;
