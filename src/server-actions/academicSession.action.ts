"use server";
import { db } from "../drizzle-DB";
import {
  academicSessionType,
  academicSessionZod,
} from "../validation/academicSessions.zod";
import { academicSessions } from "../drizzle-DB/schema/academic-session.drizzle";
import { and, eq } from "drizzle-orm";
import { createRecord } from "./crud-funtions/server-create-crud";
import { deleteRecord } from "./crud-funtions/server-delete-crud";
import { readRecord } from "./crud-funtions/server-read-crud";
import { updateRecord } from "./crud-funtions/server-update-crud";

// post
export async function createSession(data: academicSessionType) {
  return createRecord(
    {
      zodSchema: academicSessionZod,
      drizzleSchema: academicSessions,
      additionFields: { isActive: false },
    },
    data,
  );
}

// get active session id
export async function getActiveSessionId(instituteId: string) {
  const session = await db.query.academicSessions.findFirst({
    where: and(
      eq(academicSessions.instituteId, instituteId),
      eq(academicSessions.isActive, true),
    ),
    columns: {
      id: true,
    },
  });

  if (!session) throw new Error("No active session found");

  return session.id;
}

// get
export async function getSessions() {
  return readRecord({ drizzleSchema: academicSessions });
}
// delete session
export async function deleteSessions(id: string) {
  return deleteRecord(
    {
      drizzleSchema: academicSessions,
    },
    id,
  );
}

// update Sessions
export async function updateSessions(id: string, data: academicSessionType) {
  return updateRecord(
    {
      drizzleSchema: academicSessions,
      zodSchema: academicSessionZod,
    },
    id,
    data,
  );
}
