"use server";
import { db } from "../db";
import { groupClasses, groups } from "../db/schema/groups.drizzle";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import { deleteRecord } from "../lib/crud-funtions/server-delete-crud";
import { readRecord } from "../lib/crud-funtions/server-read-crud";
import {
  addGroupZod,
  inputGroupType,
  outputGroupType,
} from "../validation/groups.zod";

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
