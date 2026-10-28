"use server";

import { exams } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { parseWithZod } from "@/src/validation/validator.zod";
import { eq, or } from "drizzle-orm";
import z from "zod";

// `exams.id` is a uuid column, so a non-uuid segment (e.g. /mark-entry without
// an id) must fail validation instead of reaching Postgres
const examIdZod = z.uuid("Invalid exam id");

export async function getSingleExamData(id: string) {
  const parsed = parseWithZod(examIdZod, id);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }

  return await readMany({
    drizzleSchema: exams,
    query: ({ db, instituteId }) =>
      db.query.exams.findMany({
        where: or(eq(exams.instituteId, instituteId), eq(exams.id, id)),
        with: {
          assignClasses: {
            with: {
              class: {
                with: {
                  sections: true,
                },
              },
            },
          },
        },
      }),
  });
}
