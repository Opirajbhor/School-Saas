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

//=========== exam grade range ==========
export const examGradeRangeZod = createInsertSchema(examGradeRangeDrizzle, {
  name: (schema) => schema.min(1, { error: "name  is required" }),
  minMark: (schema) => schema.min(1, { error: "Minimum mark is required" }),
  maxMark: (schema) => schema.min(1, { error: "Maximum mark is required" }),
  GPA: (schema) => schema.min(1, { error: "GPA is required" }),
}).omit({
  instituteId: true,
});
export type InputExamGradeRangeType = z.infer<typeof examGradeRangeZod>;
export const outputExamGradeRangeZod = createSelectSchema(
  examGradeRangeDrizzle,
);
export type OutputExamGradeRangeType = z.infer<typeof examGradeRangeZod>;
