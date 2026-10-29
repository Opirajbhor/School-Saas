"use server";

import { exams } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { parseWithZod } from "@/src/validation/validator.zod";
import { and, eq, isNull, or } from "drizzle-orm";
import { examIdZod } from "../_schema/exam.zod";

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
        // the requested exam AND the caller's scope — global defaults included
        where: and(
          eq(exams.id, parsed.data),
          or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
        ),
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
