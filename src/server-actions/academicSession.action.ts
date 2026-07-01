"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import {
  academicSessionType,
  academicSessionZod,
} from "../validation/academicSessions.zod";
import { academicSessions } from "../db/schema/academic-session.drizzle";
import { eq } from "drizzle-orm";

// post
export async function acadecmicSession(data: academicSessionType) {
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
  const validatedFields = academicSessionZod.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed",
      details: errorMessages,
    };
  }
  try {
    const [newSession] = await db
      .insert(academicSessions)
      .values({
        ...validatedFields.data,
        instituteId: profile.id,
        userId: profile.userId,
      })
      .returning();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newSession)),
    };
  } catch (error) {
    console.error("Database error during academic session creation:", error);
    return {
      success: false,
      error: "Failed to create academic session due to a database failure.",
    };
  }
}

// get
export async function getAcademicSession() {
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
    const data = await db.query.academicSessions.findMany({
      where: eq(academicSessions.instituteId, info),
    });

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Database error in Academic Session list:", error);
    throw new Error("Failed to fetch Academic Session list.");
  }
}
