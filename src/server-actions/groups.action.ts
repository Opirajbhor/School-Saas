"use server";
import { db } from "../db";
import { groupClasses, groups } from "../db/schema/groups.drizzle";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";
import { readMany, readRecord } from "../lib/crud-funtions/server-read-crud";
import {
  addGroupZod,
  AssignGroupClassType,
  assignGroupClassZod,
  inputGroupType,
} from "../validation/groups.zod";
import { and, eq, inArray } from "drizzle-orm";
import { classesDrizzle } from "../db/schema";
import { requireInstitute } from "./get-institute-profile";
import { toggleStatus } from "../lib/crud-funtions/server-status.action";

// add
export async function createGroup(data: inputGroupType) {
  return await createRecord(
    {
      zodSchema: addGroupZod,
      drizzleSchema: groups,
    },
    data,
  );
}
// get
export async function getGroups() {
  return readRecord({ drizzleSchema: groups });
}

// toggle status
export async function toggleGroup(id: string) {
  return toggleStatus({ drizzleSchema: groups }, id);
}

// // get group classes
export async function getGroupClasses() {
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
            where: (groupClasses, { eq }) => eq(groupClasses.status, "ACTIVE"),
          },
        },
      }),
  });

  return result;
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

// assign to class
export async function assignGroupClasses(data: AssignGroupClassType) {
  const institute = await requireInstitute();
  const validation = assignGroupClassZod.safeParse(data);
  if (!validation.success) {
    return {
      success: false as const,
      error: "Invalid data",
      details: validation.error.flatten().fieldErrors,
    };
  }
  const { groupId, classIds } = validation.data;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Deactivate all existing classes in the group
      await tx
        .update(groupClasses)
        .set({ status: "INACTIVE" })
        .where(
          and(
            eq(groupClasses.instituteId, institute.id),
            eq(groupClasses.groupId, groupId),
          ),
        );

      // Get existing assignments to determine which are new
      const existingAssignments = await tx.query.groupClasses.findMany({
        where: and(
          eq(groupClasses.groupId, groupId),
          eq(groupClasses.instituteId, institute.id),
        ),
      });

      const existingClassIdSet = new Set(
        existingAssignments.map((item) => item.classId),
      );

      // Reactivate existing classes
      if (classIds.length > 0) {
        await tx
          .update(groupClasses)
          .set({ status: "ACTIVE" })
          .where(
            and(
              inArray(groupClasses.classId, classIds),
              eq(groupClasses.groupId, groupId),
              eq(groupClasses.instituteId, institute.id),
            ),
          );
      }

      // Create new class assignments
      const newClassIds = classIds.filter((id) => !existingClassIdSet.has(id));

      if (newClassIds.length > 0) {
        await tx.insert(groupClasses).values(
          newClassIds.map((classId) => ({
            groupId,
            classId,
            instituteId: institute.id,
            status: "ACTIVE" as const,
          })),
        );
      }

      // Return all active items
      return await tx.query.groupClasses.findMany({
        where: and(
          eq(groupClasses.groupId, groupId),
          eq(groupClasses.instituteId, institute.id),
          eq(groupClasses.status, "ACTIVE"),
        ),
      });
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to update group assignment",
      details: {},
    };
  }
}
