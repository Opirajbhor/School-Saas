"use server";
import { db } from "@/src/drizzle-DB";
import { revalidatePath } from "next/cache";
import { CreateSuperAdmin } from "@/src/server-actions/crud-funtions/super-admin/super-admin-create-crud";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  addGroupZod,
  AssignGroupClassType,
  assignGroupClassZod,
  inputGroupType,
  OutputGroupClassType,
} from "@/src/validation/groups.zod";
import { groupClasses, groups } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";

// get Default Groups and Classes
export async function getDefaultGroupClasses() {
  try {
    const result = await readMany({
      drizzleSchema: groups,
      query: ({ db }) =>
        db.query.groups.findMany({
          where: isNull(groups.instituteId),
          with: {
            groupClasses: {
              with: {
                class: true,
              },
            },
          },
          orderBy: (groups, { asc }) => [asc(groups.createdAt)],
        }),
    });
    if (!result.success) {
      return {
        success: false as const,
        error: "failed to get group data",
        details: {},
      };
    }
    const rawData = result.data as OutputGroupClassType[];
    const data = rawData.map((group) => ({
      ...group,
      groupClasses: group.groupClasses
        .filter((gc) => gc?.status === "ACTIVE")
        .map((gc) => ({
          ...gc,
          class: gc.class ?? null,
        })),
    }));

    return {
      success: true as const,
      data: data as OutputGroupClassType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// create Groups
export async function createAcademicGroups(data: inputGroupType) {
  try {
    const result = await CreateSuperAdmin(
      {
        drizzleSchema: groups,
        zodSchema: addGroupZod,
        additionFields: {},
      },
      data,
    );

    revalidatePath("/super-admin/groups");
    revalidatePath("/dashboard/groups");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicGroups failed:", error);

    return {
      success: false as const,
      error: "Failed to create Groups",
      details: {},
    };
  }
}

// change status of Groups
export async function changeStatusGroups(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      const current = await tx.query.groups.findFirst({
        where: eq(groups.id, id),
        columns: { status: true },
      });

      if (!current) throw new Error("Not found");

      return await tx
        .update(groups)
        .set({ status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
        .where(eq(groups.id, id))
        .returning();
    });
    revalidatePath("/super-admin/groups");
    revalidatePath("/dashboard/groups");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicGroups failed:", error);

    return {
      success: false as const,
      error: "Failed to create Groups",
      details: {},
    };
  }
}

// delete Groups
export async function deleteGroups(id: string) {
  try {
    const result = await db.transaction(async (tx) => {
      return await tx.delete(groups).where(eq(groups.id, id)).returning();
    });
    revalidatePath("/super-admin/academic-Groups");
    revalidatePath("/dashboard/academic-Groups");
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createAcademicGroups failed:", error);

    return {
      success: false as const,
      error: "Failed to create Groups",
      details: {},
    };
  }
}

// assign to class
export async function assignGroupClasses(data: AssignGroupClassType) {
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
        .where(eq(groupClasses.groupId, groupId));

      const existingAssignments = await tx.query.groupClasses.findMany({
        where: eq(groupClasses.groupId, groupId),
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
            status: "ACTIVE" as const,
          })),
        );
      }
      revalidatePath("/super-admin/groups");
      revalidatePath("/dashboard/groups");
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
