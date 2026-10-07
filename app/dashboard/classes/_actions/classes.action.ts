"use server";
import { classesDrizzle, sectionDrizzle } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import {
  classesType,
  classesTypeWithId,
  classesZod,
  sectionType,
  sectionZod,
} from "@/src/validation/classes.zod";
import { and, eq, isNull, or } from "drizzle-orm";
import { createRecord } from "@/src/server-actions/crud-funtions/server-create-crud";
import { deleteRecord } from "@/src/server-actions/crud-funtions/server-delete-crud";
import { toggleStatus } from "@/src/server-actions/crud-funtions/server-status.action";
import { getActiveSession } from "../../academic-sessions/_actions/session.action";

// get classes and sections
export async function getClasses() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: or(
            isNull(classesDrizzle.instituteId),
            eq(classesDrizzle.instituteId, instituteId),
          ),
          orderBy: (classesDrizzle, { asc }) => [asc(classesDrizzle.createdAt)],
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

// ------------------get only active Classes----------------
export async function getActiveClasses() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: and(
            isNull(classesDrizzle.instituteId),
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
// --------------------single class and section ------------
export async function getClassAndSection({
  classId,
  sectionId,
}: {
  classId: string;
  sectionId: string;
}) {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: and(
            eq(classesDrizzle.instituteId, instituteId),
            eq(classesDrizzle.id, classId),
          ),
          with: {
            sections: {
              where: and(
                eq(sectionDrizzle.status, "ACTIVE"),
                eq(sectionDrizzle.id, sectionId),
              ),
            },
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
  const session = await getActiveSession();
  if (!session) {
    return {
      success: false as const,
      error: "No Academic Session found",
      details: { field: ["message"] },
    };
  }
  const { id } = session;
  return createRecord(
    {
      zodSchema: classesZod,
      drizzleSchema: classesDrizzle,
      additionFields: { status: "ACTIVE", id },
      entity: "CLASS",
    },
    data,
  );
}

// toogle Status
export async function ToggleClassStatus(id: string) {
  return toggleStatus(
    {
      drizzleSchema: classesDrizzle,
      entity: "CLASS",
    },
    id,
  );
}

// -------------------- section -----------------------
// post section
export async function postSection(data: sectionType) {
  const session = await getActiveSession();
  if (!session) {
    return {
      success: false as const,
      error: "No Academic Session found",
      details: { field: ["message"] },
    };
  }
  const { id } = session;
  return createRecord(
    {
      zodSchema: sectionZod,
      drizzleSchema: sectionDrizzle,
      additionFields: { status: "ACTIVE", id },
      entity: "SECTION",
    },
    data,
  );
}

// delete section
export async function deleteSection(id: string) {
  return deleteRecord(
    {
      drizzleSchema: sectionDrizzle,
      entity: "SECTION",
    },
    id,
  );
}

// ==================== session ================
