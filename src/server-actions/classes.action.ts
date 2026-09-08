"use server";
import { and, eq } from "drizzle-orm";
import {
  classesType,
  classesTypeWithId,
  classesZod,
  sectionType,
  sectionZod,
} from "../validation/classes.zod";
import { classesDrizzle, sectionDrizzle } from "../db/schema/classes.drizzle";
import { getActiveSessionId } from "./academicSession.action";
import { requireInstitute } from "./get-institute-profile";
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
      data: result.data as classesTypeWithId[],
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
          with: {
            groupClasses: {
              with: {
                group: true,
              },
            },
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

// -------------------- section -----------------------
// post section
export async function postSection(data: sectionType) {
  const profile = await requireInstitute();
  const sessionId = await getActiveSessionId(profile?.id);

  return createRecord(
    {
      zodSchema: sectionZod,
      drizzleSchema: sectionDrizzle,
      additionFields: { status: "ACTIVE", sessionId: sessionId },
    },
    data,
  );
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
