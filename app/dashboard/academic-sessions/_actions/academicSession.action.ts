"use server";
import { db } from "../../../../src/drizzle-DB";
import {
  academicSessionType,
  academicSessionZod,
} from "../../../../src/validation/academicSessions.zod";
import { academicSessions } from "../../../../src/drizzle-DB/schema/academic-session.drizzle";
import { and, eq } from "drizzle-orm";
import { createRecord } from "../../../../src/server-actions/crud-funtions/server-create-crud";
import { deleteRecord } from "../../../../src/server-actions/crud-funtions/server-delete-crud";
import { readRecord } from "../../../../src/server-actions/crud-funtions/server-read-crud";
import { updateRecord } from "../../../../src/server-actions/crud-funtions/server-update-crud";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";

// get
export async function getSessions() {
  return readRecord({ drizzleSchema: academicSessions });
}
// get active session id
export async function getActiveSessionId() {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
    };
  }
  const { instituteId } = ctx;
  const session = await db.query.academicSessions.findFirst({
    where: and(
      eq(academicSessions.instituteId, instituteId),
      eq(academicSessions.isActive, true),
    ),
    columns: {
      id: true,
    },
  });

  if (!session) {
    return {
      success: false as const,
      details: "No active session found",
    };
  }

  return {
    success: true as const,
    data: session.id,
  };
}
// post
export async function createSession(data: academicSessionType) {
  return createRecord(
    {
      zodSchema: academicSessionZod,
      drizzleSchema: academicSessions,
      additionFields: { isActive: false },
      entity: "SESSION",
    },
    data,
  );
}

// update Sessions
export async function updateSessions(id: string, data: academicSessionType) {
  return updateRecord(
    {
      drizzleSchema: academicSessions,
      zodSchema: academicSessionZod,
      entity: "SESSION",
    },
    id,
    data,
  );
}

// delete session
export async function deleteSessions(id: string) {
  return deleteRecord(
    {
      drizzleSchema: academicSessions,
      entity: "SESSION",
    },
    id,
  );
}
