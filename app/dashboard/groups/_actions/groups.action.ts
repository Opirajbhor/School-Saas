"use server";
import {
  groupClasses,
  groups,
} from "../../../../src/drizzle-DB/schema/groups.drizzle";
import { createRecord } from "../../../../src/server-actions/crud-funtions/server-create-crud";
import {
  readMany,
  readRecord,
} from "../../../../src/server-actions/crud-funtions/server-read-crud";
import {
  addGroupZod,
  inputGroupType,
  outputGroupType,
} from "../../../../src/validation/groups.zod";
import { and, eq, isNull, or } from "drizzle-orm";
import { toggleStatus } from "../../../../src/server-actions/crud-funtions/server-status.action";

// get
export async function getGroupss() {
  return readRecord({ drizzleSchema: groups });
}

export async function getGroups() {
  try {
    const result = await readMany({
      drizzleSchema: groups,
      query: ({ db, instituteId }) =>
        db.query.groups.findMany({
          where: or(
            isNull(groups.instituteId),
            eq(groups.instituteId, instituteId),
          ),
          orderBy: (groups, { asc }) => [asc(groups.createdAt)],
        }),
    });
    return {
      success: true as const,
      data: result.data as outputGroupType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}
// // get group classes
export async function getGroupClasses() {
  try {
    const result = await readMany({
      drizzleSchema: groups,
      query: ({ db, instituteId }) =>
        db.query.groups.findMany({
          where: eq(groups.instituteId, instituteId),
          with: {
            groupClasses: {
              with: {
                class: true as const,
              },
              where: (groupClasses, { eq }) =>
                eq(groupClasses.status, "ACTIVE"),
            },
          },
        }),
    });

    return {
      success: true as const,
      data: result.data,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to get data",
      details: {},
    };
  }
}

// add
export async function createGroup(data: inputGroupType) {
  return await createRecord(
    {
      zodSchema: addGroupZod,
      drizzleSchema: groups,
      entity: "GROUP",
    },
    data,
  );
}

// toggle status
export async function toggleGroup(id: string) {
  return toggleStatus({ drizzleSchema: groups, entity: "GROUP" }, id);
}

// --------group assignments-----------------
// get active class items from group assignments
export async function getActiveAssignClasses() {
  try {
    const result = await readMany({
      drizzleSchema: groupClasses,
      query: ({ db, instituteId }) =>
        db.query.groupClasses.findMany({
          where: and(
            eq(groupClasses.instituteId, instituteId),
            eq(groupClasses.status, "ACTIVE"),
          ),
        }),
    });
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to fetch data",
      details: {},
    };
  }
}
