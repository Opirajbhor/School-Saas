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

// get classes and sections
export async function getClasses() {
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
    const data = await db.query.classesDrizzle.findMany({
      where: eq(classesDrizzle.instituteId, info),
    });

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Database error to Class and Section list:", error);
    throw new Error("Failed to fetch Class and Section list.");
  }
}

// post class
export async function postClasses(data: classesType) {
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error: verify?.success === false ? verify.error : "Unauthorized",
    };
  }
  const profile = verify.profile;
  const validatedFields = classesZod.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed",
      details: errorMessages,
    };
  }

  try {
    const [newClass] = await db
      .insert(classesDrizzle)
      .values({
        ...validatedFields.data,
        instituteId: profile?.id,
        userId: profile?.userId,
      })
      .returning();
    revalidatePath("/dashboard/*");
    revalidatePath("/dashboard/");
    revalidatePath("/dashboard/classes");
    return {
      success: true,
      data: JSON.parse(JSON.stringify(newClass)),
    };
  } catch (error) {
    console.error("Database error during Class creation:", error);
    return {
      success: false,
      error: "Failed to create class due to a database failure.",
    };
  }
}

// delete class
export async function deleteClass(classId: string) {
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
      .delete(classesDrizzle)
      .where(
        and(
          eq(classesDrizzle.id, classId),
          eq(classesDrizzle.instituteId, instituteId),
        ),
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
  const verify = await verifyUser();
  if (!verify || verify.success === false || !verify.profile) {
    return {
      success: false,
      error: verify?.success === false ? verify.error : "Unauthorized",
    };
  }
  const profile = verify.profile;
  const validatedFields = sectionZod.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    return {
      success: false,
      error: "Validation failed",
      details: errorMessages,
    };
  }

  try {
    const [newSection] = await db
      .insert(sectionDrizzle)
      .values({
        ...validatedFields.data,
        instituteId: profile?.id,
        userId: profile?.userId,
      })
      .returning();
    revalidatePath("/dashboard/classes");
    revalidatePath("/dashboard");
    return {
      success: true,
      data: JSON.parse(JSON.stringify(newSection)),
    };
  } catch (error) {
    console.error("Database error during section creation:", error);
    return {
      success: false,
      error: "Failed to create section due to a database failure.",
    };
  }
}
