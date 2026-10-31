import { redirect } from "next/navigation";
import { eq, isNull, or } from "drizzle-orm";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { PageHeader } from "@/components/dashboard/page-header";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import {
  examGradeRangeDrizzle,
  examMarkTypesDrizzle,
} from "@/src/drizzle-DB/schema";
import {
  OutputExamGradeRangeType,
  OutputExamMarkTypes,
} from "./_schema/exam.zod";
import { ExamSettingsWidgets } from "./_component/exam-settings-widgets";
import ExamListPage from "./_component/main-page/exam-page";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  // mark types and the grade scale are two small reference tables; they used
  // to sit behind two big nav cards at the bottom of this page
  const [markTypeResult, gradeResult] = await Promise.all([
    readMany({
      drizzleSchema: examMarkTypesDrizzle,
      query: ({ db, instituteId }) =>
        db.query.examMarkTypesDrizzle.findMany({
          where: or(
            isNull(examMarkTypesDrizzle.instituteId),
            eq(examMarkTypesDrizzle.instituteId, instituteId),
          ),
          orderBy: (table, { asc }) => [asc(table.createdAt)],
        }),
    }),
    readMany({
      drizzleSchema: examGradeRangeDrizzle,
      query: ({ db, instituteId }) =>
        db.query.examGradeRangeDrizzle.findMany({
          where: or(
            isNull(examGradeRangeDrizzle.instituteId),
            eq(examGradeRangeDrizzle.instituteId, instituteId),
          ),
          orderBy: (table, { asc }) => [asc(table.createdAt)],
        }),
    }),
  ]);

  // a failed lookup renders as an empty widget rather than blanking the exams
  // list below it
  const markTypes = markTypeResult.success
    ? (markTypeResult.data as OutputExamMarkTypes[])
    : [];
  const grades = gradeResult.success
    ? (gradeResult.data as OutputExamGradeRangeType[])
    : [];

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Exams"
        subtitle="Every exam, its mark-entry progress and the scale marks are graded on."
      />

      <ExamSettingsWidgets markTypes={markTypes} grades={grades} />

      <ExamListPage />
    </main>
  );
}
