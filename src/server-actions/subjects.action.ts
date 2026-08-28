"use server";
import { subjectDbSchema } from "../db/schema/subjects.drizzle";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import {
  inputSubAssignType,
  inputSubjectType,
  inputSubjectZod,
} from "../validation/subjects.zod";
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";
import { readMany, readRecord } from "../lib/crud-funtions/server-read-crud";
import { readMultipleRecords } from "../lib/crud-funtions/server-read-multiple-action";
import { classesDrizzle, groups } from "../db/schema";
import { eq } from "drizzle-orm";

// add
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

// subject Assignments

export async function getClassGroupSubject() {
  return await readMultipleRecords([
    { key: "getClasses", drizzleSchema: classesDrizzle },
    { key: "getGroups", drizzleSchema: groups },
    { key: "getSubjects", drizzleSchema: subjectDbSchema },
  ]);
}

// // get group classes
export async function getClassGroup() {
  const result = await readMany({
    drizzleSchema: classesDrizzle,
    query: ({ db, instituteId }) =>
      db.query.classesDrizzle.findMany({
        where: eq(classesDrizzle.instituteId, instituteId),
        with: {
          groups: true, 
        },
      }),
  });

  return result;
}
