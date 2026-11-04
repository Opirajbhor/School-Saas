import Link from "next/link";
import { redirect } from "next/navigation";
import { IdentificationBadge, Printer } from "@phosphor-icons/react/ssr";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import {
  getAdmitCardOptions,
  getAdmitCards,
} from "@/app/print/_actions/admit-card.action";
import { AdmitCardFilters } from "./_component/admit-card-filters";

// Admit cards — pick exam + class (+ section), check the list, print. Two cards
// land on every A4 page.
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

  const batch =
    examId && classId
      ? await getAdmitCards({ examId, classId, sectionId })
      : null;

  const students = batch?.success ? batch.data.students : [];
  const pages = Math.ceil(students.length / 2);
  const printHref =
    examId && classId
      ? `/print/admit-cards/${examId}?class=${classId}${
          sectionId ? `&section=${sectionId}` : ""
        }`
      : null;

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Admit cards"
        subtitle="Two cards per A4 page, with the student's photo, their class routine and both signatures"
        actions={
          printHref ? (
            <Button size="sm" asChild>
              <Link href={printHref} target="_blank">
                <Printer />
                Print admit cards
              </Link>
            </Button>
          ) : undefined
        }
      />

      <AdmitCardFilters
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
      />

      {!examId || !classId ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <IdentificationBadge className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Choose an exam and a class
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            The cards are built from the active enrolments of that class in the
            exam&apos;s session.
          </p>
        </Card>
      ) : batch && !batch.success ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {batch.error}
        </Card>
      ) : students.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No students to print
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
              icon={IdentificationBadge}
              footer={
                <p className="text-xs text-muted-foreground">
                  active enrolments
                </p>
              }
            />
            <Metric
              label="Pages"
              value={metricValue(pages)}
              icon={Printer}
              footer={
                <p className="text-xs text-muted-foreground">two per A4 page</p>
              }
            />
            <Metric
              label="Class"
              value={batch?.success ? batch.data.klass.name : "—"}
              icon={IdentificationBadge}
              footer={
                <p className="text-xs text-muted-foreground">
                  {batch?.success && batch.data.section
                    ? `section ${batch.data.section.name}`
                    : "all sections"}
                </p>
              }
            />
            <Metric
              label="Routine rows"
              value={metricValue(batch?.success ? batch.data.routine.length : 0)}
              icon={IdentificationBadge}
              footer={
                <p className="text-xs text-muted-foreground">
                  printed on each card
                </p>
              }
            />
          </div>

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
                    <th className="px-3 py-2 font-medium">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.enrollmentId} className="border-b last:border-0">
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
                      <td className="px-3 py-2">
                        {student.photoUrl ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            ready
                          </span>
                        ) : (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                            missing
                          </span>
                        )}
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
