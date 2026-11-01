import Link from "next/link";
import { IoArrowBackOutline as ArrowLeft } from "react-icons/io5";

import { FcDataConfiguration as Configuration } from "react-icons/fc";
import { IoCheckmarkDoneOutline as ActiveIcon } from "react-icons/io5";
import { IoCloseOutline as InactiveIcon } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { TableCard } from "@/components/table/tanstack/table-card";
import { ExamMarkTypeColumn } from "../../_table/exam-marktype-columns";
import { ExamMarkTypeDialog } from "../../_component/exam-marktype-dialog";
import { getDefaultMarkTypes } from "../../_actions/exam.action";
import type { OutputExamMarkTypes } from "../../_schema/exam.zod";

export default async function Page() {
  const result = await getDefaultMarkTypes();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load mark types
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const rows = (result.data ?? []) as OutputExamMarkTypes[];
  const active = rows.filter((row) => row.status === "ACTIVE").length;

  return (
    <main className="my-6 w-full max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Mark types"
        subtitle="The paper types every subject is configured against — CQ, MCQ, practical."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/super-admin/exam">
                <ArrowLeft />
                Exams
              </Link>
            </Button>
            <ExamMarkTypeDialog />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Mark types"
          value={metricValue(rows.length)}
          icon={Configuration}
          segments={[
            { value: active, className: "bg-foreground" },
            { value: rows.length - active, className: "bg-foreground/25" },
          ]}
          footer={
            <p className="text-xs text-muted-foreground">platform defaults</p>
          }
        />
        <Metric
          label="Active"
          value={metricValue(active)}
          icon={ActiveIcon}
          footer={
            <p className="text-xs text-muted-foreground">used by mark config</p>
          }
        />
        <Metric
          label="Inactive"
          value={metricValue(rows.length - active)}
          icon={InactiveIcon}
          footer={
            <p className="text-xs text-muted-foreground">
              hidden from new config
            </p>
          }
        />
      </div>

      <TableCard
        title="All mark types"
        hint="Every institute uses these"
        searchPlaceholder="Search mark types..."
        columns={ExamMarkTypeColumn}
        data={rows}
      />
    </main>
  );
}
