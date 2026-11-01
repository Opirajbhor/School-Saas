"use server";

import { count, desc, isNull } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import {
  academicSessions,
  classesDrizzle,
  enrollments,
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
  exams,
  groups,
  instituteProfile,
  sectionDrizzle,
  subjectDbSchema,
  teachers,
} from "@/src/drizzle-DB/schema";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";

export type PlatformCounts = {
  institutes: number;
  activeInstitutes: number;
  students: number;
  teachers: number;
  exams: number;
  sections: number;
  defaultClasses: number;
  defaultSubjects: number;
  defaultGroups: number;
  defaultMarkTypes: number;
  defaultGradeBands: number;
};

export type PlatformInstitute = {
  id: string;
  nameEnglish: string;
  nameBangla: string;
  eiin: string;
  division: string;
  district: string;
  status: string;
  createdAt: Date;
  students: number;
  teachers: number;
};

export type PlatformSession = { year: string; status: string };

/**
 * Everything the platform dashboard shows. All reads go through the Drizzle
 * query builder; per-institute student and teacher numbers come from two
 * grouped counts rather than a correlated subquery per row.
 */
export async function getPlatformOverview() {
  const auth = await AccessServer("superadmin");
  if (!auth.allowed) {
    return { success: false as const, error: "Not authorised" };
  }

  try {
    const [
      instituteRows,
      sessionRows,
      studentGroups,
      teacherGroups,
      defaultClasses,
      defaultSubjects,
      defaultGroups,
      defaultMarkTypes,
      defaultGradeBands,
      examTotal,
      sectionTotal,
    ] = await Promise.all([
      db
        .select({
          id: instituteProfile.id,
          nameEnglish: instituteProfile.nameEnglish,
          nameBangla: instituteProfile.nameBangla,
          eiin: instituteProfile.eiin,
          division: instituteProfile.division,
          district: instituteProfile.district,
          status: instituteProfile.status,
          createdAt: instituteProfile.createdAt,
        })
        .from(instituteProfile)
        .orderBy(desc(instituteProfile.createdAt)),

      db
        .select({ year: academicSessions.year, status: academicSessions.status })
        .from(academicSessions)
        .orderBy(desc(academicSessions.year)),

      db
        .select({ instituteId: enrollments.instituteId, total: count() })
        .from(enrollments)
        .groupBy(enrollments.instituteId),

      db
        .select({ instituteId: teachers.instituteId, total: count() })
        .from(teachers)
        .groupBy(teachers.instituteId),

      // platform defaults: rows with no institute, inherited by every school
      db
        .select({ total: count() })
        .from(classesDrizzle)
        .where(isNull(classesDrizzle.instituteId)),

      db
        .select({ total: count() })
        .from(subjectDbSchema)
        .where(isNull(subjectDbSchema.instituteId)),

      db
        .select({ total: count() })
        .from(groups)
        .where(isNull(groups.instituteId)),

      db
        .select({ total: count() })
        .from(examMarkTypesDrizzle)
        .where(isNull(examMarkTypesDrizzle.instituteId)),

      db
        .select({ total: count() })
        .from(examGradeRangeDrizzle)
        .where(isNull(examGradeRangeDrizzle.instituteId)),

      db.select({ total: count() }).from(exams),
      db.select({ total: count() }).from(sectionDrizzle),
    ]);

    const studentsByInstitute = new Map(
      studentGroups.map((row) => [row.instituteId, Number(row.total)]),
    );
    const teachersByInstitute = new Map(
      teacherGroups.map((row) => [row.instituteId, Number(row.total)]),
    );

    const institutes: PlatformInstitute[] = instituteRows.map((row) => ({
      ...row,
      students: studentsByInstitute.get(row.id) ?? 0,
      teachers: teachersByInstitute.get(row.id) ?? 0,
    }));

    const totalOf = (rows: { total: unknown }[]) => Number(rows[0]?.total ?? 0);

    const counts: PlatformCounts = {
      institutes: institutes.length,
      activeInstitutes: institutes.filter((row) => row.status === "ACTIVE")
        .length,
      // a student counts once enrolled somewhere
      students: studentGroups.reduce((sum, row) => sum + Number(row.total), 0),
      teachers: teacherGroups.reduce((sum, row) => sum + Number(row.total), 0),
      exams: totalOf(examTotal),
      sections: totalOf(sectionTotal),
      defaultClasses: totalOf(defaultClasses),
      defaultSubjects: totalOf(defaultSubjects),
      defaultGroups: totalOf(defaultGroups),
      defaultMarkTypes: totalOf(defaultMarkTypes),
      defaultGradeBands: totalOf(defaultGradeBands),
    };

    return {
      success: true as const,
      data: {
        counts,
        institutes,
        sessions: sessionRows,
      },
    };
  } catch (error) {
    console.error("platform overview failed:", error);
    return { success: false as const, error: "Could not load platform stats" };
  }
}
