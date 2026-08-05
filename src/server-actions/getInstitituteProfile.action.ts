"use server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { instituteProfile } from "../db/schema";
import { currentUser } from "./currentUser.action";
import { ProfileUpdateType, profileUpdateZod } from "../validation/profile.zod";
import { parseWithZod, ValidationResult } from "../validation/validator.zod";

// get login institute profile
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
export async function instituteProfileUpdate(
  data: ProfileUpdateType,
): Promise<ValidationResult<ProfileUpdateType>> {
  const session = await currentUser();
  const userId = await session?.user.id;
  if (!userId) {
    return {
      success: false,
      error: "Institute not found",
      details: {},
    };
  }

  // parse with zod-----------------
  const result = parseWithZod(profileUpdateZod, data);
  if (!result.success) return result;
  // parse with zod-----------------

  try {
    const [updatedProfile] = await db
      .update(instituteProfile)
      .set(result.data)
      .where(eq(instituteProfile.userId, userId))
      .returning();

    if (!updatedProfile) {
      return {
        success: false as const,
        error: "Profile records could not be found.",
        details: {},
      };
    }
    return { success: true as const, data: updatedProfile };
  } catch (error) {
    console.error("Database error in instituteProfileUpdate:", error);
    return {
      success: false as const,
      error: "Profile records could not be found.",
      details: {},
    };
  }
}
