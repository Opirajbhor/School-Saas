import Link from "next/link";
import { ArrowLeft, Star as Rating, Checks as ActiveIcon, Flag as LowestIcon } from "@phosphor-icons/react/ssr";



import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { TableCard } from "@/components/table/tanstack/table-card";
import { ExamGradeRangeColumn } from "../../_table/exam-graderange-columns";
import { ExamGradeRangeDialog } from "../../_component/exam-graderange-dialog";
import { getDefaultGradeRange } from "../../_actions/exam.action";
import type { OutputExamGradeRangeType } from "../../_schema/exam.zod";

export default async function Page() {
  const result = await getDefaultGradeRange();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load grade ranges
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const rows = (
    (result.data ?? []) as OutputExamGradeRangeType[]
  ).sort((a, b) => b.minMark - a.minMark);
  const active = rows.filter((row) => row.status === "ACTIVE");
  const top = active[0];
  const bottom = active[active.length - 1];

  return (
    <main className="my-6 w-full max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Grade ranges"
        subtitle="Mark bands and the GPA each one is worth. Grade points are read from here when a result is calculated."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/super-admin/exam">
                <ArrowLeft />
                Exams
              </Link>
            </Button>
            <ExamGradeRangeDialog />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Grade bands"
          value={metricValue(rows.length)}
          icon={Rating}
          segments={[
            { value: active.length, className: "bg-foreground" },
            { value: rows.length - active.length, className: "bg-foreground/25" },
          ]}
          footer={
            <p className="text-xs text-muted-foreground">highest band first</p>
          }
        />
        <Metric
          label="Active"
          value={metricValue(active.length)}
          icon={ActiveIcon}
          footer={
            <p className="text-xs text-muted-foreground">
              {top
                ? `top band ${top.name} · GPA ${Number(top.GPA).toFixed(2)}`
                : "none active"}
            </p>
          }
        />
        <Metric
          label="Lowest pass"
          value={bottom ? bottom.name : "—"}
          icon={LowestIcon}
          footer={
            <p className="text-xs text-muted-foreground">
              {bottom ? `from ${bottom.minMark} marks` : "no bands yet"}
            </p>
          }
        />
      </div>

      <TableCard
        title="All grade bands"
        hint="A missing band means GPA cannot be calculated"
        searchPlaceholder="Search grades..."
        columns={ExamGradeRangeColumn}
        data={rows}
      />
    </main>
  );
}
