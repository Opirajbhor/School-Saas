"use server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { instituteProfile, teachers } from "../db/schema";
import { currentUser } from "./currentUser.action";
import { ProfileUpdateType, profileUpdateZod } from "../validation/profile.zod";
import { parseWithZod, ValidationResult } from "../validation/validator.zod";
import { requireInstitute } from "./get-user-context.action";

// get login institute profile
export async function getInstituteProfile() {
  const { instituteId } = await requireInstitute();

  try {
    const profile = await db.query.instituteProfile.findFirst({
      where: eq(instituteProfile.id, instituteId),
    });
    return profile ?? null;
  } catch (error) {
    console.error("Database error in getInstituteProfile:", error);
    throw new Error("Failed to fetch institute profile.");
  }
}

// get login teacher profile
export async function getLoggedInTeacher() {
  const { role, userId } = await requireInstitute();
  console.log(role, userId)
  try {
    if (role !== "user") {
      throw new Error("Unauthorized");
    }
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, userId),
    });
    if (!teacher) {
      throw new Error("teacher data not found");
    }

    return teacher;
  } catch (error) {
    console.log("teacher data not found", error);
    throw new Error("Teacher Data not Found");
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
