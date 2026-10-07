"use server";

import { db } from "@/src/drizzle-DB";
import { subjectAssignSchema, subjectDbSchema } from "@/src/drizzle-DB/schema";
import { createRecord } from "@/src/server-actions/crud-funtions/server-create-crud";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { toggleStatus } from "@/src/server-actions/crud-funtions/server-status.action";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import {
  inputSubAssignType,
  InputSubjectType,
  inputSubjectZod,
  OutputSubjectType,
  RawSubjectAssignment,
} from "@/src/validation/subjects.zod";
import { eq, isNull, or } from "drizzle-orm";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";
import { getActiveSession } from "../../academic-sessions/_actions/session.action";

// ------------ post a new subject ---------------
export async function addSubjects(data: InputSubjectType) {
  return createRecord(
    {
      zodSchema: inputSubjectZod,
      drizzleSchema: subjectDbSchema,
      additionFields: { status: "ACTIVE" },
      entity: "SUBJECT",
    },
    data,
  );
}

// ------------get all the subjects------------------

export async function getSubjects() {
  try {
    const result = await readMany({
      drizzleSchema: subjectDbSchema,
      query: ({ db, instituteId }) =>
        db.query.subjectDbSchema.findMany({
          where: or(
            isNull(subjectDbSchema.instituteId),
            eq(subjectDbSchema.instituteId, instituteId),
          ),
          orderBy: (subjectDbSchema, { asc }) => [
            asc(subjectDbSchema.createdAt),
          ],
        }),
    });
    return {
      success: true as const,
      data: result.data as OutputSubjectType[],
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

//------------- toogle subject Status -----------------
export async function ToggleSubjectStatus(id: string) {
  return toggleStatus(
    {
      drizzleSchema: subjectDbSchema,
      entity: "SUBJECT",
    },
    id,
  );
}

// ------------subject assignment *** custom server action-----------
export async function subjectAssignment(data: inputSubAssignType) {
  const { subjectIds, ...rest } = data;

  // ----Validate that at least one subject was selected-------.
  try {
    if (!subjectIds.length) {
      return {
        success: false as const,
        error: "Please select at least one subject",
        details: {},
      };
    }
    const ctx = await getUserContext();

    if (!ctx) {
      return {
        success: false as const,
        error: "No User session foundF",
        details: {},
      };
    }
    const { userId, instituteId } = ctx;
    const session = await getActiveSession();
    if (!session) {
      return {
        success: false as const,
        error: "No Academic Session found",
        details: { field: ["message"] },
      };
    }
    const { id } = session;
    // If any subject assignment fails, ALL assignments are rolled back.
    await db.transaction(async (tx) => {
      return Promise.all(
        subjectIds.map(async (subjectId) => {
          const payload = {
            instituteId,
            sessionId: id,
            classId: rest.classId,
            groupId: rest.groupId,
            subjectType: rest.subjectType,
            subjectId,
            status: "ACTIVE" as const,
          };
          const [data] = await tx
            .insert(subjectAssignSchema)
            .values(payload)
            .returning();
          // =========audit logs==========
          await createAuditLog(tx, {
            instituteId,
            userId,
            action: "CREATED",
            entity: "ASSIGNED_SUBJECT",
            entityId: data.id,
          });
        }),
      );
    });
    const resultsValue = await getAssignSubjects();

    return {
      success: true as const,
      data: resultsValue.data,
    };
  } catch (err) {
    console.error("Subject assignment failed:", err);
    return {
      success: false as const,
      error: "Failed to assign subjects",
      details: {},
    };
  }
}

// ------------get all the assigned subjects------------------
export async function getAssignSubjects() {
  try {
    const result = await readMany({
      drizzleSchema: subjectAssignSchema,
      query: ({ db, instituteId }) =>
        db.query.subjectAssignSchema.findMany({
          where: eq(subjectAssignSchema.instituteId, instituteId),
          with: {
            class: true,
            subject: true,
            group: true,
          },
        }),
    });

    if (!result.success) {
      return {
        success: false as const,
        error: "failed to get data",
        details: {},
      };
    }
    const data = result.data as RawSubjectAssignment[];
    const formatedData = data.map((item) => ({
      id: item.id,
      instituteId: item.instituteId,
      sessionId: item.sessionId,
      classId: item.classId,
      groupId: item.groupId,
      subjectId: item.subjectId,
      subjectType: item.subjectType ?? undefined,
      status: item.status,
      subjectName: item.subject?.name ?? "",
      groupName: item.group?.name ?? "",
      className: item.class?.name ?? "",
    }));
    return {
      success: true as const,
      data: formatedData,
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

//------------- toogle assign subject Status -----------------
export async function ToggleAssignSubjectStatus(id: string) {
  return toggleStatus(
    {
      drizzleSchema: subjectAssignSchema,
      entity: "ASSIGNED_SUBJECT",
    },
    id,
  );
}
