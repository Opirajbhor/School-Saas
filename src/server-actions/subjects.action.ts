"use server";
import { subjectDbSchema } from "../db/schema/subjects.drizzle";
import { createRecord } from "../lib/crud-funtions/server-create-crud";
import { inputSubjectType, inputSubjectZod } from "../validation/subjects.zod";
import { readMany, readRecord } from "../lib/crud-funtions/server-read-crud";

import { classesDrizzle } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { toggleStatus } from "../lib/crud-funtions/server-status.action";
import { ClassesWithGroups } from "../validation/classes.zod";

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

// toogle Status
export async function ToggleSubjectStatus(id: string) {
  return toggleStatus(
    {
      drizzleSchema: subjectDbSchema,
    },
    id,
  );
}

// // get group classes
export async function getClassGroup() {
  try {
    const result = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.classesDrizzle.findMany({
          where: and(
            eq(classesDrizzle.instituteId, instituteId),
            eq(classesDrizzle.isActive, true),
          ),
          with: {
            groupClasses: {
              with: {
                group: true,
              },
            },
          },
        }),
    });
    const data = result.data;
    const classes = data?.map((classItem: ClassesWithGroups) => ({
      id: classItem.id,
      name: classItem.name,
      status: classItem.status,
      groups: classItem.groupClasses.map((item) => item.group),
    }));

    return {
      success: true as const,
      data: data,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "failed to get class Data",
      details: {},
    };
  }
}
