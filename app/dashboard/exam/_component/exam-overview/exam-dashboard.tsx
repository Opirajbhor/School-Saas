"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/table/tanstack/data-table";
import { getExamDashboard } from "../../_actions/monitoring.action";
import { monitoringUnitColumns } from "../../_table/monitoring-columns";
import { ProgressBar } from "./monitoring-ui";
import EditRequestQueue from "./edit-request-queue";
import MarkWorkflowBar from "./mark-workflow-bar";

const CARD_ICON = "flex size-9 shrink-0 items-center justify-center rounded-lg";

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
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Spinner />
        Loading progress...
      </div>
    );
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

  const stats = [
    {
      label: "Total Units",
      value: summary.totalUnits,
      subtext: `${summary.unconfiguredUnits} not configured`,
      icon: <Layers size={18} />,
    },
    {
      label: "Completed",
      value: summary.completedUnits,
      subtext: `${summary.incompleteUnits} incomplete`,
      icon: <CheckCircle2 size={18} />,
    },
    {
      label: "Pending Requests",
      value: summary.pendingRequests,
      subtext: summary.pendingRequests > 0 ? "awaiting approval" : "none",
      icon: <Clock size={18} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Exam-level mark lock: finalize / publish */}
      <MarkWorkflowBar examId={examId} />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`${CARD_ICON} bg-muted text-muted-foreground`}>
                  {stat.icon}
                </div>
                <CardDescription className="text-sm font-medium">
                  {stat.label}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {stat.subtext}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`${CARD_ICON} bg-muted text-muted-foreground`}>
                <BookOpen size={18} />
              </div>
              <CardDescription className="text-sm font-medium">
                Overall
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {summary.completion}%
            </p>
            <ProgressBar value={summary.completion} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Class-wise and section-wise progress */}
      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border">
          <CardTitle>Progress by Class & Section</CardTitle>
          <CardDescription>
            Only units with students and configured mark types count toward
            completion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {classes.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No classes are assigned to this exam yet.
            </p>
          )}

          {classes.map((classRow) => (
            <div
              key={classRow.classId}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">
                  {classRow.className}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {classRow.completed}/{classRow.units} units complete
                  </span>
                  <ProgressBar value={classRow.completion} className="w-32" />
                </div>
              </div>

              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {classRow.sections.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No sections in this class.
                  </p>
                )}
                {classRow.sections.map((section) => (
                  <div
                    key={section.sectionId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {section.sectionName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
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
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Subject-level monitoring */}
      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border">
          <CardTitle>Subject Monitoring</CardTitle>
          <CardDescription>
            Open a subject to see student-level entry status and missing marks.
          </CardDescription>
        </CardHeader>

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
