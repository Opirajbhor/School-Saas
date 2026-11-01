"use server";

import { asc, desc, isNull } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import {
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  exams,
  subjectDbSchema,
  subjectMarkTemplates,
} from "@/src/drizzle-DB/schema";

export type PlatformExamRow = {
  id: string;
  name: string;
  status: string;
  markWorkflow: string;
  sessionYear: string | null;
  classes: string[];
  /** shape the assign dialog reads */
  assignClasses: { class: { id: string } | null }[];
};

export type PlatformExamOverview = {
  counts: {
    exams: number;
    activeExams: number;
    markTypes: number;
    activeMarkTypes: number;
    gradeBands: number;
    configuredSubjects: number;
    totalSubjects: number;
  };
  markTypes: { id: string; name: string; status: string }[];
  gradeBands: { name: string; minMark: number; maxMark: number; gpa: string }[];
  exams: PlatformExamRow[];
};

/**
 * Everything the platform exam page shows. Reads `institute_id IS NULL` rows
 * directly — a superadmin has no teacher context, so readMany() cannot be used.
 */
export async function getPlatformExamOverview() {
  try {
    const [examRows, markTypeRows, gradeRows, configured, subjectRows] =
      await Promise.all([
      db.query.exams.findMany({
        where: isNull(exams.instituteId),
        with: {
          session: true,
          assignClasses: { with: { class: true } },
        },
        orderBy: [desc(exams.createdAt)],
      }),
      db.query.examMarkTypesDrizzle.findMany({
        where: isNull(examMarkTypesDrizzle.instituteId),
        orderBy: [asc(examMarkTypesDrizzle.createdAt)],
      }),
      db.query.examGradeRangeDrizzle.findMany({
        where: isNull(examGradeRangeDrizzle.instituteId),
        orderBy: [desc(examGradeRangeDrizzle.minMark)],
      }),
      // one row per subject that has at least one mark template
      db
        .select({ subjectId: subjectMarkTemplates.subjectId })
        .from(subjectMarkTemplates)
        .groupBy(subjectMarkTemplates.subjectId),
      db.query.subjectDbSchema.findMany({
        where: isNull(subjectDbSchema.instituteId),
        columns: { id: true },
      }),
    ]);

    const data: PlatformExamOverview = {
      counts: {
        exams: examRows.length,
        activeExams: examRows.filter((row) => row.status === "ACTIVE").length,
        markTypes: markTypeRows.length,
        activeMarkTypes: markTypeRows.filter((row) => row.status === "ACTIVE")
          .length,
        gradeBands: gradeRows.length,
        configuredSubjects: configured.length,
        totalSubjects: subjectRows.length,
      },
      markTypes: markTypeRows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
      })),
      gradeBands: gradeRows.map((row) => ({
        name: row.name,
        minMark: row.minMark,
        maxMark: row.maxMark,
        gpa: row.GPA,
      })),
      exams: examRows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        markWorkflow: row.markWorkflow,
        sessionYear: row.session?.year ?? null,
        classes: row.assignClasses
          .filter((item) => item.status === "ACTIVE" && item.class)
          .map((item) => item.class!.name),
        assignClasses: row.assignClasses
          .filter((item) => item.class)
          .map((item) => ({ class: { id: item.class!.id } })),
      })),
    };

    return { success: true as const, data };
  } catch (error) {
    console.error("platform exam overview failed:", error);
    return {
      success: false as const,
      error: "Could not load examinations",
    };
  }
}
