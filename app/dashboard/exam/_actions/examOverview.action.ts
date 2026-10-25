"use server";

import { exams } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { eq, or } from "drizzle-orm";

export async function getSingleExamData(id: string) {
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
