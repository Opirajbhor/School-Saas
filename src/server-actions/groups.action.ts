"use server";
import { revalidatePath } from "next/cache";
import { db } from "../db";
import { groupClasses, groups } from "../db/schema/groups.drizzle";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";
import { readRecord } from "../lib/crud-funtions/server-read-crud";
import {
  addGroupZod,
  AssignGroupClassType,
  assignGroupClassZod,
  inputGroupType,
} from "../validation/groups.zod";
import { and, eq, inArray } from "drizzle-orm";
import { classesDrizzle } from "../db/schema";
import { requireInstitute } from "./get-institute-profile";

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
// delete
export async function deleteGroup(id: string) {
  return deleteRecord(
    {
      drizzleSchema: groups,
    },
    id,
  );
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

  // Verify group belongs to current institute
  const group = await db.query.groups.findFirst({
    where: and(eq(groups.id, groupId), eq(groups.instituteId, institute.id)),
    columns: {
      id: true,
    },
  });

  if (!group) {
    return {
      success: false as const,
      error: "Group not found",
      details: {},
    };
  }

  // Verify all selected classes belong to current institute
  const classes = await db
    .select({
      id: classesDrizzle.id,
    })
    .from(classesDrizzle)
    .where(
      and(
        eq(classesDrizzle.instituteId, institute.id),
        inArray(classesDrizzle.id, classIds),
      ),
    );

  if (classes.length !== classIds.length) {
    return {
      success: false as const,
      error: "One or more classes are invalid",
      details: {},
    };
  }
  const values = classIds.map((classId) => ({
    instituteId: institute.id,
    groupId,
    classId,
  }));

  const assigned = await db
    .insert(groupClasses)
    .values(values)
    .onConflictDoNothing({
      target: [groupClasses.groupId, groupClasses.classId],
    })
    .returning();

  return {
    success: true as const,
    data: assigned,
  };
}
