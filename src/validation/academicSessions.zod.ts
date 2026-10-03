import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { academicSessions } from "../drizzle-DB/schema";
export const academicSessionZod = createInsertSchema(academicSessions);

export type academicSessionType = z.infer<typeof academicSessionZod>;

export type sessionList = {
  id: string;
  userId: string | null;
  instituteId: string;
  year: string;
  isActive: boolean;
};
