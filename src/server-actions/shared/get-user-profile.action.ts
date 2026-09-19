"use server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { instituteProfile, teachers } from "@/src/db/schema";
import { requireUserContext } from "./get-user-context.action";
import {
  InsituteProfileUpdateType,
  insituteProfileUpdateZod,
} from "@/src/validation/institute-profile.zod";
import { revalidatePath } from "next/cache";

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
    console.error("teacher data not found", error);
    throw new Error("Teacher Data not Found");
  }
}

// institute profile update
export async function instituteProfileUpdate(data: InsituteProfileUpdateType) {
  try {
    // 1. Auth — get institute ID from session
    const { instituteId } = await requireUserContext();

    // 2. Validate input
    const parsed = insituteProfileUpdateZod.safeParse(data);
    if (!parsed.success) {
      return {
        success: false as const,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      };
    }

    // 3. Update record
    const [updated] = await db
      .update(instituteProfile)
      .set(parsed.data)
      .where(eq(instituteProfile.id, instituteId))
      .returning();

    if (!updated) {
      return {
        success: false as const,
        error: "Institute not found",
        details: {},
      };
    }

    // 4. Revalidate cached pages
    revalidatePath("/dashboard/profile");

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("instituteProfileUpdate error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Something went wrong",
      details: {},
    };
  }
}
