import { createUpdateSchema } from "drizzle-zod";
import { instituteProfile } from "../db/schema";
import z from "zod";

export const insituteProfileUpdateZod = createUpdateSchema(instituteProfile);

export type InsituteProfileUpdateType = z.infer<
  typeof insituteProfileUpdateZod
>;
