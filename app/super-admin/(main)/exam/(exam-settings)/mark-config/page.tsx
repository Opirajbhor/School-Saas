import Link from "next/link";
import { Gear as Settings, Checks as Checked, Stack as Papers, ArrowLeft } from "@phosphor-icons/react/ssr";


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { MarkConfigTable } from "../../_table/mark-config-table";
import { getDefaultSubjectMark } from "../../_actions/defaultMark.action";
import type { OutputDefaultMarkTypes } from "../../_schema/markInput.zod";

export default async function Page() {
  const result = await getDefaultSubjectMark();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load mark configuration
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const subjects = (result.data ?? []) as OutputDefaultMarkTypes[];
  const configured = subjects.filter(
    (subject) => subject.markTemplates.length > 0,
  ).length;
  const papers = subjects.reduce(
    (sum, subject) => sum + subject.markTemplates.length,
    0,
  );

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Mark configuration"
        subtitle="Full and pass marks for every subject paper. A subject with no templates cannot be graded."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/super-admin/exam">
              <ArrowLeft />
              Exams
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Subjects"
          value={metricValue(subjects.length)}
          icon={Settings}
          segments={[
            { value: configured, className: "bg-foreground" },
            { value: subjects.length - configured, className: "bg-foreground/25" },
          ]}
          footer={
            <p className="text-xs text-muted-foreground">
              {configured} configured
            </p>
          }
        />
        <Metric
          label="Configured"
          value={metricValue(configured)}
          icon={Checked}
          footer={
            <p className="text-xs text-muted-foreground">
              have at least one paper
            </p>
          }
        />
        <Metric
          label="Paper marks"
          value={metricValue(papers)}
          icon={Papers}
          footer={
            <p className="text-xs text-muted-foreground">
              full and pass mark rows
            </p>
          }
        />
      </div>

      <MarkConfigTable data={subjects} />
    </main>
  );
}
