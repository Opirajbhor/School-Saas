"use server";
import {
  subjectAssignSchema,
  subjectDbSchema,
} from "../db/schema/subjects.drizzle";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import {
  inputSubAssignType,
  inputSubjectType,
  inputSubjectZod,
  RawSubjectAssignment,
} from "../validation/subjects.zod";
import { readMany, readRecord } from "../lib/crud-funtions/server-read-crud";

import { eq } from "drizzle-orm";
import { toggleStatus } from "../lib/crud-funtions/server-status.action";
import { requireInstitute } from "./get-institute-profile";
import { getActiveSessionId } from "./academicSession.action";
import { db } from "../db";

// ------------ post a new subject ---------------
export async function addSubjects(data: inputSubjectType) {
  return createRecord(
    {
      zodSchema: inputSubjectZod,
      drizzleSchema: subjectDbSchema,
      additionFields: { status: "ACTIVE" },
    },
    data,
  );
}

// ------------get all the subjects------------------
export async function getSubjects() {
  return readRecord({ drizzleSchema: subjectDbSchema });
}

//------------- toogle subject Status -----------------
export async function ToggleSubjectStatus(id: string) {
  return toggleStatus(
    {
      drizzleSchema: subjectDbSchema,
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

    const profile = await requireInstitute();
    const sessionId = await getActiveSessionId(profile.id);

    if (!sessionId) {
      return {
        success: false as const,
        error: "No active academic session found",
        details: {},
      };
    }

    // Everything inside this transaction succeeds together.
    // If any subject assignment fails, ALL assignments are rolled back.
    const results = await db.transaction(async (tx) => {
      return Promise.all(
        subjectIds.map((subjectId) => {
          const payload = {
            instituteId: profile.id,
            sessionId,
            classId: rest.classId,
            groupId: rest.groupId,
            subjectType: rest.subjectType,
            subjectId,
            status: "ACTIVE" as const,
          };
          return tx.insert(subjectAssignSchema).values(payload).returning();
        }),
      );
    });

    return {
      success: true as const,
      data: results.flat(),
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

// ------------get all the subjects------------------
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
