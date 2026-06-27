"use server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { instituteProfile } from "../db/schema";
import { currentUser } from "./currentUser.action";
import { ProfileUpdateType, profileUpdateZod } from "../validation/profile.zod";

export async function getInstituteProfile() {
  const session = await currentUser();
  const userId = await session?.user.id;
  if (!userId) {
    console.warn(" No active session found.");
    return null;
  }
  try {
    const profile = await db.query.instituteProfile.findFirst({
      where: eq(instituteProfile.userId, userId),
    });

    return profile || null;
  } catch (error) {
    console.error("Database error in getInstituteProfile:", error);
    throw new Error("Failed to fetch institute profile.");
  }
}

// institute profile update
export async function instituteProfileUpdate(data: ProfileUpdateType) {
  const session = await currentUser();
  const userId = await session?.user.id;
  if (!userId) {
    console.warn(" No active session found.");
    return null;
  }
  const result = profileUpdateZod.safeParse(data);
  if (!result.success) {
    console.error("Server-side validation failed:", result.error.format());
    return {
      success: false,
      error: "Invalid input data format.",
      details: result.error.flatten().fieldErrors,
    };
  }
  try {
    const [updatedProfile] = await db
      .update(instituteProfile)
      .set(result.data)
      .where(eq(instituteProfile.userId, userId))
      .returning();

    if (!updatedProfile) {
      return { success: false, error: "Profile records could not be found." };
    }
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("Database error in instituteProfileUpdate:", error);
    throw new Error("Failed to update institute profile.");
  }
}
