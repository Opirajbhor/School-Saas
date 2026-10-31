import { ExamCard } from "./exam-card";
import { SpinnerCustom } from "@/components/Spinner";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { redirect } from "next/navigation";

import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { eq, isNull, or } from "drizzle-orm";
import { exams } from "@/src/drizzle-DB/schema";
import { OutputExamType, sortAssignedClasses } from "../../_schema/exam.zod";
import { ExamMonitoringSummaryType } from "../../_schema/exam.zod";
import Link from "next/link";
import {
  getExamProgress,
  type ExamProgressRow,
} from "@/app/dashboard/_actions/dashboard.action";

/**
 * The exams page used to call getExamMonitoringSummaries, which ran a handful
 * of queries per exam — minutes of waiting once an institute has a few exams.
 * getExamProgress answers the same question with five grouped queries.
 */
function toSummary(row: ExamProgressRow): ExamMonitoringSummaryType {
  const units = row.papers;
  const completedUnits = row.papersEntered;
  const completion =
    units === 0 ? 0 : Math.round((completedUnits / units) * 100);

  return {
    examId: row.id,
    examName: row.name,
    sessionName: row.sessionYear,
    assignedClasses: row.assignedClasses,
    units,
    completedUnits,
    completion,
    status:
      units > 0 && completedUnits >= units
        ? "COMPLETED"
        : completedUnits > 0
          ? "IN_PROGRESS"
          : "NOT_STARTED",
    pendingRequests: row.pendingRequests,
  };
}

export default async function ExamListPage() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const [result, summaryResult] = await Promise.all([
    readMany({
      drizzleSchema: exams,
      query: ({ db, instituteId }) =>
        db.query.exams.findMany({
          where: or(
            isNull(exams.instituteId),
            eq(exams.instituteId, instituteId),
          ),
          with: {
            assignClasses: {
              with: {
                class: true,
              },
            },
          },
        }),
    }),
    getExamProgress(),
  ]);
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const examData = result.data as OutputExamType[];

  // the badge list on each exam card must read Class 6, 7, 8..., not
  // exam_classes insert order
  for (const exam of examData) {
    if (exam.assignClasses) {
      exam.assignClasses = sortAssignedClasses(exam.assignClasses);
    }
  }

  // progress per exam; missing summaries simply render as not started
  const summaryByExam = new Map(
    (summaryResult.success ? summaryResult.data.map(toSummary) : []).map(
      (summary) => [summary.examId, summary],
    ),
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Available exams
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {examData.length}
          </span>
        </h2>
      </div>

      {/* Empty state */}
      {examData.length === 0 && (
        <p className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No exams yet. Create one to start monitoring mark entry.
        </p>
      )}

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {examData.map((exam) => (
          <Link key={exam.id} href={`/dashboard/exam/${exam.id}`}>
            <ExamCard exam={exam} summary={summaryByExam.get(exam.id)} />
          </Link>
        ))}
      </div>
    </div>
  );
}
