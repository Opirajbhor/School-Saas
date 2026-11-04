"use server";
import {
  classesDrizzle,
  groupClasses,
  sectionDrizzle,
} from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import {
  classesType,
  classesTypeWithId,
  ClassesWithGroups,
  classesZod,
  compareClassName,
  sectionType,
  sectionZod,
} from "@/src/validation/classes.zod";
import { and, eq, isNull, or } from "drizzle-orm";
import { createRecord } from "@/src/server-actions/crud-funtions/server-create-crud";
import { deleteRecord } from "@/src/server-actions/crud-funtions/server-delete-crud";
import { toggleStatus } from "@/src/server-actions/crud-funtions/server-status.action";
import { getActiveSession } from "../../_actions/session.action";

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
          with: {
            // classes are global defaults, sections are not: without this the
            // response carried every tenant's section names
            sections: {
              where: eq(sectionDrizzle.instituteId, instituteId),
            },
          },
        }),
    });
    return {
      success: true as const,
      data: (result.data as classesTypeWithId[]).sort(compareClassName),
    };
  } catch (error) {
    console.error("action failed:", error);
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
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
            or(
              isNull(classesDrizzle.instituteId),
              eq(classesDrizzle.instituteId, instituteId),
            ),
            eq(classesDrizzle.status, "ACTIVE"),
          ),
          with: {
            groupClasses: {
              where: eq(groupClasses.instituteId, instituteId),
              with: {
                group: true,
              },
            },
          },
        }),
    });
    return {
      success: true as const,
      data: (result.data as ClassesWithGroups[]).sort(compareClassName),
    };
  } catch (error) {
    console.error("action failed:", error);
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
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
            eq(classesDrizzle.id, classId),
            or(
              isNull(classesDrizzle.instituteId),
              eq(classesDrizzle.instituteId, instituteId),
            ),
          ),
          with: {
            sections: {
              where: and(
                eq(sectionDrizzle.status, "ACTIVE"),
                eq(sectionDrizzle.id, sectionId),
                eq(sectionDrizzle.instituteId, instituteId),
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
    console.error("action failed:", error);
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
      details: {},
    };
  }
}

// ------------------get only active Classes----------------
export async function getClassSectionGroups() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: and(
            or(
              isNull(classesDrizzle.instituteId),
              eq(classesDrizzle.instituteId, instituteId),
            ),
            eq(classesDrizzle.status, "ACTIVE"),
          ),
          with: {
            groupClasses: {
              where: eq(groupClasses.instituteId, instituteId),
              with: {
                group: true,
              },
            },
            sections: {
              where: eq(sectionDrizzle.instituteId, instituteId),
            },
          },
        }),
    });
    return {
      success: true as const,
      data: (result.data as ClassesWithGroups[]).sort(compareClassName),
    };
  } catch (error) {
    console.error("action failed:", error);
    return {
      success: false as const,
      error: "Something went wrong. Please try again.",
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
  return createRecord(
    {
      zodSchema: classesZod,
      drizzleSchema: classesDrizzle,
      // the class row gets its own id: reusing the session id made the primary
      // key collide on the second class an institute ever created
      additionFields: { status: "ACTIVE" },
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
      additionFields: { status: "ACTIVE", sessionId: id },
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
