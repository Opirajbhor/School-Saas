"use server";
import { db } from "../db";
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
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";
import { readMany } from "../lib/crud-funtions/server-read-crud";
import { toggleStatus } from "../lib/crud-funtions/server-status.action";
import { createRecord } from "../lib/crud-funtions/server-create-crud";

// get classes and sections
export async function getClasses() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: and(eq(classesDrizzle.instituteId, instituteId)),
          with: {
            sections: true,
          },
        }),
    });
    return {
      success: true as const,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// post class
export async function postClasses(data: classesType) {
  const profile = await requireInstitute();
  const sessionId = await getActiveSessionId(profile?.id);
  return createRecord(
    {
      zodSchema: classesZod,
      drizzleSchema: classesDrizzle,
      additionFields: { status: "ACTIVE", sessionId: sessionId },
    },
    data,
  );
}

// toogle Status
export async function ToggleClassStatus(id: string) {
  return toggleStatus(
    {
      drizzleSchema: classesDrizzle,
    },
    id,
  );
}

// ------------------get only active Classes----------------
export async function getActiveClasses() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: and(
            eq(classesDrizzle.instituteId, instituteId),
            eq(classesDrizzle.status, "ACTIVE"),
          ),
        }),
    });
    return {
      success: true as const,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// -------------------- section -----------------------
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

// delete section
export async function deleteSection(id: string) {
  return deleteRecord(
    {
      drizzleSchema: sectionDrizzle,
    },
    id,
  );
}
