"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/table/tanstack/data-table";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { getExamDashboard } from "../../_actions/monitoring.action";
import { monitoringUnitColumns } from "../../_table/monitoring-columns";
import { ProgressBar } from "./monitoring-ui";
import EditRequestQueue from "./edit-request-queue";
import MarkWorkflowBar from "./mark-workflow-bar";

// Detailed progress for one exam. Fetched only after the exam is opened, and
// student-level data is never pulled here.
export default function ExamDashboard({ examId }: { examId: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["examMonitoring", "dashboard", examId],
    queryFn: async () => {
      const result = await getExamDashboard(examId);
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
  });

  if (isPending) {
    return <PageSkeleton rows={4} />;
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load progress</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load data."}
        </AlertDescription>
      </Alert>
    );
  }

  const { summary, classes, units } = data;

  const remaining = Math.max(summary.totalUnits - summary.completedUnits, 0);

  return (
    <div className="space-y-4">
      {/* Exam-level mark lock: finalize / publish */}
      <MarkWorkflowBar examId={examId} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Papers"
          value={metricValue(summary.totalUnits)}
          icon={Layers}
          footer={
            <p className="text-xs text-muted-foreground">
              {summary.unconfiguredUnits} without mark types
            </p>
          }
        />

        <Metric
          label="Complete"
          value={metricValue(summary.completedUnits)}
          icon={CheckCircle2}
          segments={
            summary.totalUnits > 0
              ? [
                  { value: summary.completedUnits, className: "bg-foreground" },
                  { value: remaining, className: "bg-foreground/20" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              {summary.incompleteUnits} incomplete
            </p>
          }
        />

        <Metric
          label="Overall"
          value={`${summary.completion}%`}
          icon={Gauge}
          segments={[
            { value: summary.completion, className: "bg-foreground" },
            { value: Math.max(100 - summary.completion, 0), className: "bg-foreground/20" },
          ]}
          footer={
            <p className="text-xs text-muted-foreground">
              of all papers entered
            </p>
          }
        />

        <Metric
          label="Pending requests"
          value={metricValue(summary.pendingRequests)}
          icon={Clock}
          footer={
            <p className="text-xs text-muted-foreground">
              {summary.pendingRequests > 0 ? "awaiting approval" : "none"}
            </p>
          }
        />
      </div>

      {/* Class-wise and section-wise progress */}
      <Card className="gap-0 overflow-hidden p-0">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Progress by class
          </h2>
          <p className="text-xs text-muted-foreground">
            Only papers with students and configured mark types count toward
            completion.
          </p>
        </div>

        <div className="divide-y">
          {classes.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No classes are assigned to this exam yet.
            </p>
          )}

          {classes.map((classRow) => (
            <div key={classRow.classId} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {classRow.className}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {classRow.completed}/{classRow.units} papers
                  </span>
                  <ProgressBar value={classRow.completion} className="w-40" />
                  <span className="w-9 text-right text-[11px] font-medium tabular-nums text-foreground">
                    {classRow.completion}%
                  </span>
                </div>
              </div>

              {classRow.sections.length > 0 && (
                <div className="mt-2 space-y-1 border-l pl-3">
                  {classRow.sections.map((section) => (
                    <div
                      key={section.sectionId}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-xs text-muted-foreground">
                        {section.sectionName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {section.completed}/{section.units}
                        </span>
                        <ProgressBar
                          value={section.completion}
                          className="w-28"
                          muted={section.units === 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Subject-level monitoring */}
      <Card className="gap-0 overflow-hidden p-0">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Subject monitoring
          </h2>
          <p className="text-xs text-muted-foreground">
            Open a subject to see student-level entry status and missing marks.
          </p>
        </div>

        {units.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No section and subject combinations to monitor for this exam.
          </p>
        ) : (
          <DataTable
            columns={monitoringUnitColumns(examId)}
            data={units}
            filterColumn="className"
            filterPlaceholder="Filter by class..."
          />
        )}
      </Card>

      {/* Admin approval queue */}
      <EditRequestQueue examId={examId} />

      {/* Empty hint when nothing is monitorable */}
      {units.length > 0 && units.every((unit) => !unit.configured) && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Mark types are not configured</AlertTitle>
          <AlertDescription>
            Configure mark types for these subjects under Exam Settings, then
            progress can be measured.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
