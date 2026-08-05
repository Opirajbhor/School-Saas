"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import { AddSubjectType, addSubjectZod } from "../validation/subjects.zod";
import { subjectDbSchema } from "../db/schema/subjects.drizzle";
import { getActiveSessionId } from "./academicSession.action";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireInstitute } from "./get-institute-profile";
import { parseWithZod } from "../validation/validator.zod";

// add subject
export async function addSubjects(data: AddSubjectType) {
  const profile = await requireInstitute();

  const sessionId = await getActiveSessionId(profile?.id);
  // parse with zod-----------------
  const validatedFields = parseWithZod(addSubjectZod, data);
  if (!validatedFields.success) return validatedFields;
  // parse with zod-----------------

  try {
    const [newSubject] = await db
      .insert(subjectDbSchema)
      .values({
        ...validatedFields.data,
        instituteId: profile.id,
        sessionId: sessionId,
      })
      .returning();

    return {
      success: true as const,
      data: newSubject,
    };
  } catch (error) {
    console.error("Database error during subject creation:", error);
    return {
      success: false as const,
      error: "Failed to create subject due to a database failure.",
      details: {},
    };
  }
}

// get Subjects list
export async function getSubjects() {
  const { id } = await requireInstitute();

  try {
    const data = await db.query.subjectDbSchema.findMany({
      where: eq(subjectDbSchema.instituteId, id),
    });

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Database error in Subject list:", error);
    throw new Error("Failed to fetch Subject list.");
  }
}

// delete SUBJECT
export async function deleteSubject(id: string) {
  const info = await requireInstitute();

  try {
    const result = await db
      .delete(subjectDbSchema)
      .where(
        and(
          eq(subjectDbSchema.id, id),
          eq(subjectDbSchema.instituteId, info.id),
        ),
      )
      .returning({
        id: subjectDbSchema.id,
      });

    if (result.length === 0) {
      return {
        success: false,
        error: "Class not found.",
      };
    }
    revalidatePath("/dashboard/");
    return {
      success: true,
      message: "subject deleted successfully.",
    };
  } catch (error) {
    console.error("Delete subject error:", error);

    return {
      success: false,
      error: "Failed to delete subject.",
    };
  }
}
