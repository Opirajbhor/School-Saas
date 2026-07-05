"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import {
  academicSessionType,
  academicSessionZod,
} from "../validation/academicSessions.zod";
import { academicSessions } from "../db/schema/academic-session.drizzle";
import { and, eq, ne } from "drizzle-orm";

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
    return await db.transaction(async (tx) => {
      const [newSession] = await tx
        .insert(academicSessions)
        .values({
          ...validatedFields.data,
          instituteId: profile.id,
          userId: profile.userId,
        })
        .returning();
      // deactivate others
      if (newSession.isActive) {
        await tx
          .update(academicSessions)
          .set({ isActive: false })
          .where(
            and(
              eq(academicSessions.instituteId, profile.id),
              ne(academicSessions.id, newSession.id),
            ),
          );
      }
      return {
        success: true,
        data: newSession,
      };
    });
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

// get active session id
export async function getActiveSessionId(instituteId: string) {
  const session = await db.query.academicSessions.findFirst({
    where: and(
      eq(academicSessions.instituteId, instituteId),
      eq(academicSessions.isActive, true),
    ),
    columns: {
      id: true,
    },
  });

  if (!session) throw new Error("No active session found");

  return session.id;
}
