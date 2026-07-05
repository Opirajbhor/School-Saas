"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import { AddSubjectType, addSubjectZod } from "../validation/subjects.zod";
import { subjectDbSchema } from "../db/schema/subjects.drizzle";
import { getActiveSessionId } from "./academicSession.action";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addSubjects(data: AddSubjectType) {
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const profile = verify.profile;
  const validatedFields = addSubjectZod.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed",
      details: errorMessages,
    };
  }
  const sessionId = await getActiveSessionId(profile?.id);

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
      success: true,
      data: newSubject,
    };
  } catch (error) {
    console.error("Database error during subject creation:", error);
    return {
      success: false,
      error: "Failed to create subject due to a database failure.",
    };
  }
}

// get Subjects list
export async function getSubjects() {
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const info = verify.profile.id;
  try {
    const data = await db.query.subjectDbSchema.findMany({
      where: eq(subjectDbSchema.instituteId, info),
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
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error:
        verify?.success === false
          ? verify.error
          : "Failed to verify user profile.",
    };
  }
  const instituteId = verify.profile.id;
  try {
    const result = await db
      .delete(subjectDbSchema)
      .where(
        and(
          eq(subjectDbSchema.id, id),
          eq(subjectDbSchema.instituteId, instituteId),
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
