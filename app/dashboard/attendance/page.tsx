import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardText, Printer } from "@phosphor-icons/react/ssr";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import {
  getAdmitCardOptions,
  getAdmitCards,
} from "@/app/print/_actions/admit-card.action";
import {
  AttendanceControls,
  AttendanceLayout,
} from "./_component/attendance-controls";

// Attendance sheets — same data as the admit cards (students, routine,
// institute), printed as a register or one/two students per page.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const query = await searchParams;
  const pick = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const options = await getAdmitCardOptions();
  if (!options.success) {
    return (
      <main className="my-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {options.error}
        </Card>
      </main>
    );
  }

  const { exams, classes, sections } = options.data;
  const examId = exams.some((exam) => exam.id === pick("exam"))
    ? (pick("exam") as string)
    : undefined;
  const classId = classes.some((klass) => klass.id === pick("class"))
    ? (pick("class") as string)
    : undefined;
  const sectionId = sections.some((section) => section.id === pick("section"))
    ? (pick("section") as string)
    : undefined;
  const layout = (["all", "2", "1"] as const).includes(
    pick("layout") as AttendanceLayout,
  )
    ? (pick("layout") as AttendanceLayout)
    : "all";

  const batch =
    examId && classId
      ? await getAdmitCards({ examId, classId, sectionId })
      : null;

  const students = batch?.success ? batch.data.students : [];
  const papers = batch?.success ? batch.data.routine.length : 0;

  const printHref =
    examId && classId
      ? `/print/attendance/${examId}?class=${classId}${
          sectionId ? `&section=${sectionId}` : ""
        }&layout=${layout}`
      : null;

  const pageCount =
    layout === "all"
      ? students.length > 0
        ? 1
        : 0
      : layout === "2"
        ? Math.ceil(students.length / 2)
        : students.length;

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Attendance sheets"
        subtitle="One register, two students a page, or a full page each — with a signature line against every paper"
        actions={
          printHref && students.length > 0 ? (
            <Button size="sm" asChild>
              <Link href={printHref} target="_blank">
                <Printer />
                Print sheets
              </Link>
            </Button>
          ) : undefined
        }
      />

      <AttendanceControls
        exams={exams.map((exam) => ({ label: exam.name, value: exam.id }))}
        classes={classes.map((klass) => ({ label: klass.name, value: klass.id }))}
        sections={sections.map((section) => ({
          label: section.name,
          value: section.id,
          classId: section.classId,
        }))}
        examId={examId}
        classId={classId}
        sectionId={sectionId}
        layout={layout}
      />

      {!examId || !classId ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <ClipboardText className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Choose an exam and a class
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Sheets list the active enrolments of that class and every paper on
            the exam routine.
          </p>
        </Card>
      ) : students.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No students to list
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            This class has no active enrolment for the exam&apos;s session.
            {sectionId
              ? " Try clearing the section filter."
              : " Enrol students first, then come back."}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Metric
              label="Students"
              value={metricValue(students.length)}
              icon={ClipboardText}
              footer={
                <p className="text-xs text-muted-foreground">
                  active enrolments
                </p>
              }
            />
            <Metric
              label="Papers"
              value={metricValue(papers)}
              icon={ClipboardText}
              footer={
                <p className="text-xs text-muted-foreground">
                  from the exam routine
                </p>
              }
            />
            <Metric
              label="Pages"
              value={metricValue(pageCount)}
              icon={Printer}
              footer={
                <p className="text-xs text-muted-foreground">
                  {layout === "all"
                    ? "single register"
                    : layout === "2"
                      ? "two per page"
                      : "one per page"}
                </p>
              }
            />
            <Metric
              label="Class"
              value={batch?.success ? batch.data.klass.name : "—"}
              icon={ClipboardText}
              footer={
                <p className="text-xs text-muted-foreground">
                  {batch?.success && batch.data.section
                    ? `section ${batch.data.section.name}`
                    : "all sections"}
                </p>
              }
            />
          </div>

          {papers === 0 && (
            <Card className="border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              This exam has no routine for the class yet, so the sheets will only
              carry the student list. Add the routine first for a column per
              paper.
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Roll</th>
                    <th className="px-3 py-2 font-medium">Student</th>
                    <th className="px-3 py-2 font-medium">ID</th>
                    <th className="px-3 py-2 font-medium">Section</th>
                    <th className="px-3 py-2 font-medium">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr
                      key={student.enrollmentId}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums">
                        {student.roll}
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium text-foreground">
                          {student.englishName}
                        </p>
                        {student.banglaName && (
                          <p className="text-xs text-muted-foreground">
                            {student.banglaName}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
                        {student.studentCode}
                      </td>
                      <td className="px-3 py-2 text-xs">{student.sectionName}</td>
                      <td className="px-3 py-2 text-xs">
                        {student.groupName ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}
