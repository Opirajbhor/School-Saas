"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import { AddSubjectType, addSubjectZod } from "../validation/subjects.zod";
import { subjectDbSchema } from "../db/schema/subjects.drizzle";
import { getActiveSessionId } from "./academicSession.action";

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
