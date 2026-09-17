"use server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { instituteProfile, teachers } from "@/src/db/schema";
import { requireUserContext } from "./get-user-context.action";

// get login institute profile
export async function getInstituteProfile() {
  const { instituteId, teacherId } = await requireUserContext();
  try {
    const [institute, teacher] = await Promise.all([
      db.query.instituteProfile.findFirst({
        where: eq(instituteProfile.id, instituteId),
      }),
      teacherId
        ? db.query.teachers.findFirst({
            where: eq(teachers.id, teacherId),
          })
        : Promise.resolve(null),
    ]);

    if (!institute) return null;
    return {
      institute,
      teacher: teacher ?? null,
    };
  } catch (error) {
    console.error("Database error in getInstituteProfile:", error);
    throw Error("Failed to fetch institute profile.");
  }
}

// get login teacher profile
export async function getLoggedInTeacher() {
  const { role, userId } = await requireUserContext();
  if (role !== "user") {
    throw new Error("Unauthorized");
  }
  try {
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
