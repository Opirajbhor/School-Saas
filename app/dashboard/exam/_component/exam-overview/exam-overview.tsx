"use server";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Layers,
  Users,
} from "lucide-react";
import { getSingleExamData } from "../../_actions/examOverview.action";
import { ExamOverViewType } from "../../_schema/exam.zod";
import ExamDashboard from "./exam-dashboard";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { StatusPill } from "@/components/dashboard/status-pill";

export default async function ExamOverview({ id }: { id: string }) {
  const result = await getSingleExamData(id);
  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {result.error instanceof Error
            ? result.error.message
            : "Failed to load exam data"}
        </AlertTitle>
      </Alert>
    );
  }
  const examData = result.data as unknown as ExamOverViewType[];
  const currentData = examData.find((exam) => exam.id === id);
  if (!currentData) {
    return (
      <Alert>
        <AlertTitle>No exam data found</AlertTitle>
      </Alert>
    );
  }

  const classRows = currentData.assignClasses ?? [];

  const totalSections = classRows.reduce(
    (sum, row) => sum + (row.class?.sections?.length ?? 0),
    0,
  );
  const totalStudents = classRows.reduce(
    (sum, row) => sum + (row.class?.students?.length ?? 0),
    0,
  );
  // one paper per class–subject pair; the same subject in two classes is two
  // mark sheets to enter
  const totalPapers = classRows.reduce(
    (sum, row) => sum + (row.class?.subjects?.length ?? 0),
    0,
  );
  const activeClasses = classRows.filter(
    (row) => row.status === "ACTIVE",
  ).length;
  const inactiveClasses = classRows.length - activeClasses;

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={currentData.name}
        subtitle={`Created ${formatDateTime(currentData.createdAt)} · updated ${formatDateTime(
          currentData.updatedAt,
        )}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={currentData.status} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/exam">
                <ArrowLeft />
                Exams
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Classes"
          value={metricValue(classRows.length)}
          icon={BookOpen}
          segments={
            classRows.length > 0
              ? [
                  { value: activeClasses, className: "bg-foreground" },
                  { value: inactiveClasses, className: "bg-foreground/25" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              {activeClasses} active
            </p>
          }
        />

        <Metric
          label="Sections"
          value={metricValue(totalSections)}
          icon={Layers}
          footer={
            <p className="text-xs text-muted-foreground">
              across {classRows.length} classes
            </p>
          }
        />

        <Metric
          label="Students"
          value={metricValue(totalStudents)}
          icon={Users}
          footer={
            <p className="text-xs text-muted-foreground">
              enrolled in these classes
            </p>
          }
        />

        <Metric
          label="Subject papers"
          value={metricValue(totalPapers)}
          icon={BookOpen}
          footer={
            <p className="text-xs text-muted-foreground">
              mark sheets to enter
            </p>
          }
        />
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <Tabs defaultValue="classes">
          <div className="border-b px-4">
            <TabsList variant="line" className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="classes"
                className="cursor-pointer px-3 py-2.5 text-sm"
              >
                Classes
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                className="cursor-pointer px-3 py-2.5 text-sm"
              >
                Mark entry progress
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="classes" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">Class</TableHead>
                    <TableHead className="px-4">Sections</TableHead>
                    <TableHead className="px-4 text-center">Papers</TableHead>
                    <TableHead className="px-4 text-center">Students</TableHead>
                    <TableHead className="px-4">Status</TableHead>
                    <TableHead className="px-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-sm text-muted-foreground"
                      >
                        No classes assigned to this exam yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {classRows.map((row) => (
                    <TableRow key={row.classId}>
                      <TableCell className="px-4 font-medium text-foreground">
                        {row.class?.name ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 text-xs text-muted-foreground">
                        {row.class?.sections?.map((s) => s.name).join(", ") ||
                          "—"}
                      </TableCell>
                      <TableCell className="px-4 text-center tabular-nums">
                        {row.class?.subjects?.length ?? 0}
                      </TableCell>
                      <TableCell className="px-4 text-center tabular-nums">
                        {row.class?.students?.length ?? 0}
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusPill status={row.status} />
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/dashboard/exam/mark-input?examId=${currentData.id}&classId=${row.classId}`}
                          >
                            Enter marks
                            <ArrowRight />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-0 p-4">
            <ExamDashboard examId={currentData.id} />
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
