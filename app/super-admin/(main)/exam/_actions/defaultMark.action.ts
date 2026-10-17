"use server";
import { db } from "@/src/drizzle-DB";

// get Default exam mark types
export async function getDefaultSubjectMark() {
  console.log("starting---");
  try {
    const result = await db.query.subjectDbSchema.findMany({
      with: {
        markTemplates: {
          with: {
            markType: true,
          },
        },
      },
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}
