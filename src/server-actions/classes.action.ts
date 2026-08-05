"use server";
import { db } from "../db";
import { verifyUser } from "./verifyUser.action";
import { and, eq } from "drizzle-orm";
import {
  classesType,
  classesZod,
  sectionType,
  sectionZod,
} from "../validation/classes.zod";
import { classesDrizzle, sectionDrizzle } from "../db/schema/classes.drizzle";
import { revalidatePath } from "next/cache";
import { getActiveSessionId } from "./academicSession.action";
import { requireInstitute } from "./get-institute-profile";
import { parseWithZod } from "../validation/validator.zod";

// get classes and sections
export async function getClasses() {
  const { id } = await requireInstitute();
  try {
    const data = await db.query.classesDrizzle.findMany({
      where: eq(classesDrizzle.instituteId, id),
      with: {
        sections: true,
      },
    });

    return {
      success: true,
      data: data || [],
    };
  } catch {
    throw new Error("Failed to fetch Class and Section list.");
  }
}

// post class
export async function postClasses(data: classesType) {
  const profile = await requireInstitute();
  // parse with zod-----------------
  const validatedFields = parseWithZod(classesZod, data);
  if (!validatedFields.success) return validatedFields;
  // parse with zod-----------------

  // active session id
  const sessionId = await getActiveSessionId(profile?.id);
  try {
    const [newClass] = await db
      .insert(classesDrizzle)
      .values({
        ...validatedFields.data,
        instituteId: profile?.id,
        userId: profile.userId,
        sessionId: sessionId,
      })
      .returning();
    revalidatePath("/dashboard/");
    revalidatePath("/dashboard/classes");
    return {
      success: true as const,
      data: newClass,
    };
  } catch (error) {
    console.error("Database error during Class creation:", error);
    return {
      success: false as const,
      error: "Failed to create class due to a database failure.",
      details: {},
    };
  }
}

// delete class
export async function deleteClass(classId: string) {
  const { id } = await requireInstitute();
  try {
    const result = await db
      .delete(classesDrizzle)
      .where(
        and(eq(classesDrizzle.id, classId), eq(classesDrizzle.instituteId, id)),
      )
      .returning({
        id: classesDrizzle.id,
      });

    if (result.length === 0) {
      return {
        success: false,
        error: "Class not found.",
      };
    }
    revalidatePath("/dashboard/*");
    revalidatePath("/dashboard/");
    revalidatePath("/dashboard/classes");
    return {
      success: true,
      message: "Class deleted successfully.",
    };
  } catch (error) {
    console.error("Delete class error:", error);

    return {
      success: false,
      error: "Failed to delete class.",
    };
  }
}

// post section
export async function postSection(data: sectionType) {
  const profile = await requireInstitute();
  const sessionId = await getActiveSessionId(profile?.id);

  // parse with zod-----------------
  const validatedFields = parseWithZod(sectionZod, data);
  if (!validatedFields.success) return validatedFields;
  // parse with zod-----------------

  try {
    const [newSection] = await db
      .insert(sectionDrizzle)
      .values({
        ...validatedFields.data,
        instituteId: profile?.id,
        userId: profile?.userId,
        sessionId: sessionId,
      })
      .returning();
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: newSection,
    };
  } catch (error) {
    console.error("Database error during section creation:", error);
    return {
      success: false,
      error: "Failed to create section due to a database failure.",
    };
  }
}
