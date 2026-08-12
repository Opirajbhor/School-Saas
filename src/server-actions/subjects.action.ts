"use server";
import { subjectDbSchema } from "../db/schema/subjects.drizzle";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import { inputSubjectType, inputSubjectZod } from "../validation/subjects.zod";
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";
import { readRecord } from "../lib/crud-funtions/server-read-crud";

// add
export async function addSubjects(data: inputSubjectType) {
  return createRecord(
    {
      zodSchema: inputSubjectZod,
      drizzleSchema: subjectDbSchema,
      additionFields: { status: "ACTIVE", isReligion: false, religion: null },
    },
    data,
  );
}

// get
export async function getSubjects() {
  return readRecord({ drizzleSchema: subjectDbSchema });
}

// delete
export async function deleteSubject(id: string) {
  return deleteRecord(
    {
      drizzleSchema: subjectDbSchema,
    },
    id,
  );
}
