import { notFound, redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getExamResult } from "@/app/dashboard/exam/_actions/result.action";
import ReportToolbar from "@/app/dashboard/exam/_component/result-page/reports/report-toolbar";
import { ReportCard } from "@/app/dashboard/exam/_component/result-page/reports/report-card";
import { TabulationSheet } from "@/app/dashboard/exam/_component/result-page/reports/tabulation-sheet";
import { SubjectSummaryReport } from "@/app/dashboard/exam/_component/result-page/reports/subject-summary";
import { MeritListReport } from "@/app/dashboard/exam/_component/result-page/reports/merit-list";

// The reports a print route can render. Each is a view of the same calculated
// sheet, so none of them recompute anything.
const REPORTS = ["report-card", "tabulation", "summary", "merit"] as const;
type ReportKind = (typeof REPORTS)[number];

// Printable documents, opened from /dashboard/results. They read the exam +
// class from the path and the report's options from the query string, then
// render the same result sheet the dashboard shows — including the frozen
// snapshot when the exam is published.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string; classId: string; report: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const { examId, classId, report } = await params;
  if (!REPORTS.includes(report as ReportKind)) notFound();
  const kind = report as ReportKind;

  const query = await searchParams;
  // a repeated query param arrives as an array, which would fail uuid
  // validation later — take the first value consistently
  const pick = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const sectionId = pick("section");
  const studentId = pick("student");

  const result = await getExamResult({ examId, classId });
  if (!result.success) notFound();
  const sheet = result.data;

  // the toolbar needs the same options to keep the print/back links working
  const options = { sectionId, studentId };

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:max-w-none print:p-0">
      <ReportToolbar
        report={kind}
        examId={examId}
        classId={classId}
        options={options}
      />

      {kind === "report-card" && (
        <ReportCard sheet={sheet} enrollmentId={studentId} />
      )}
      {kind === "tabulation" && (
        <TabulationSheet sheet={sheet} sectionId={sectionId} />
      )}
      {kind === "summary" && (
        <SubjectSummaryReport sheet={sheet} sectionId={sectionId} />
      )}
      {kind === "merit" && (
        <MeritListReport sheet={sheet} sectionId={sectionId} />
      )}
    </div>
  );
}
