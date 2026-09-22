"use server";
import { db } from "../../../../src/drizzle-DB";
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
  AssignGroupClassType,
  assignGroupClassZod,
  inputGroupType,
} from "../../../../src/validation/groups.zod";
import { and, eq, inArray } from "drizzle-orm";
import { toggleStatus } from "../../../../src/server-actions/crud-funtions/server-status.action";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";

// get
export async function getGroups() {
  return readRecord({ drizzleSchema: groups });
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

// assign to class
export async function assignGroupClasses(data: AssignGroupClassType) {
  const ctx = await getUserContext();

  if (!ctx) {
    return {
      success: false as const,
      error: "No User session foundF",
      details: {},
    };
  }
  const { userId, instituteId } = ctx;

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
            eq(groupClasses.instituteId, instituteId),
            eq(groupClasses.groupId, groupId),
          ),
        );

      // Get existing assignments to determine which are new
      const existingAssignments = await tx.query.groupClasses.findMany({
        where: and(
          eq(groupClasses.groupId, groupId),
          eq(groupClasses.instituteId, instituteId),
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
              eq(groupClasses.instituteId, instituteId),
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
            instituteId,
            status: "ACTIVE" as const,
          })),
        );
      }

      // =========audit logs==========
      for (const item of newClassIds) {
        await createAuditLog(tx, {
          instituteId,
          userId,
          action: "CREATED",
          entity: "ASSIGNED_CLASS_TO_GROUP",
          entityId: item,
          metadata: { groupId },
        });
      }
      // Return all active items
      return await tx.query.groupClasses.findMany({
        where: and(
          eq(groupClasses.groupId, groupId),
          eq(groupClasses.instituteId, instituteId),
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
