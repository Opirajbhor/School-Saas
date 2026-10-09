"use server";

import { subjectAssignSchema, subjectDbSchema } from "@/src/drizzle-DB/schema";
import { createRecord } from "@/src/server-actions/crud-funtions/server-create-crud";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { toggleStatus } from "@/src/server-actions/crud-funtions/server-status.action";
import {
  InputSubjectType,
  inputSubjectZod,
  OutputSubjectType,
} from "@/src/validation/subjects.zod";
import { eq, isNull, or } from "drizzle-orm";

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
