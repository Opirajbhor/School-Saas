"use server";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  BookOpen,
  Layers,
  Users,
} from "lucide-react";
import { getSingleExamData } from "../../_actions/examOverview.action";
import { ExamOverViewType } from "../../_schema/exam.zod";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CARD_ICON =
  "flex size-10 shrink-0 items-center justify-center rounded-lg";

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
  const totalSubjects = classRows.reduce(
    (sum, row) => sum + (row.class?.subjects?.length ?? 0),
    0,
  );
  const totalStudents = classRows.reduce(
    (sum, row) => sum + (row.class?.students?.length ?? 0),
    0,
  );
  const activeClasses = classRows.filter(
    (row) => row.status === "ACTIVE",
  ).length;
  const activePercentage =
    classRows.length > 0
      ? Math.round((activeClasses / classRows.length) * 100)
      : 0;
  const sectionNames = classRows
    .flatMap((row) => row.class?.sections ?? [])
    .map((section) => section.name);

  const stats = [
    {
      label: "Assigned Classes",
      value: classRows.length,
      subtext: `${activeClasses} active`,
      icon: <BookOpen size={18} />,
    },
    {
      label: "Total Sections",
      value: totalSections,
      subtext: sectionNames.join(", ") || "—",
      icon: <Layers size={18} />,
    },
    {
      label: "Total Students",
      value: totalStudents,
      subtext: `${totalSubjects} subjects assigned`,
      icon: <Users size={18} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Section */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div
                className={`${CARD_ICON} bg-primary text-primary-foreground`}
              >
                <BookOpen size={20} />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">{currentData.name}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                  <Calendar size={14} />
                  <span>Created {formatDateTime(currentData.createdAt)}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>Updated {formatDateTime(currentData.updatedAt)}</span>
                </CardDescription>
              </div>
            </div>
            <CardAction className="flex items-center gap-2">
              <StatusBadge status={currentData.status} />
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/exam">
                  <ArrowLeft />
                  Back to Exams
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`${CARD_ICON} bg-muted text-muted-foreground`}
                  >
                    {stat.icon}
                  </div>
                  <CardDescription className="text-sm font-medium">
                    {stat.label}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {stat.subtext}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Active Classes Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`${CARD_ICON} bg-muted text-muted-foreground`}>
                  <BookOpen size={18} />
                </div>
                <CardDescription className="text-sm font-medium">
                  Active Classes
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-foreground">
                  {activeClasses}
                </p>
                <p className="text-xs text-muted-foreground">
                  / {classRows.length}
                </p>
              </div>
              <div className="flex flex-1 flex-col items-end gap-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${activePercentage}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {activePercentage}% active
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Section */}
        <Card className="gap-0 py-0">
          <Tabs defaultValue="classes">
            <div className="border-b border-border px-4">
              <TabsList variant="line" className="h-auto bg-transparent p-0">
                <TabsTrigger value="classes" className="px-3 py-3">
                  Classes Overview
                </TabsTrigger>
                <TabsTrigger value="progress" className="px-3 py-3">
                  Mark Entry Progress
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="classes" className="mt-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4 text-xs uppercase">
                      Class
                    </TableHead>
                    <TableHead className="px-4 text-xs uppercase">
                      Sections
                    </TableHead>
                    <TableHead className="px-4 text-center text-xs uppercase">
                      Subjects
                    </TableHead>
                    <TableHead className="px-4 text-center text-xs uppercase">
                      Students
                    </TableHead>
                    <TableHead className="px-4 text-xs uppercase">
                      Status
                    </TableHead>
                    <TableHead className="px-4 text-xs uppercase">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
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
                      <TableCell className="px-4 text-muted-foreground">
                        {row.class?.sections?.map((s) => s.name).join(", ") ||
                          "—"}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        {row.class?.subjects?.length ?? 0}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        {row.class?.students?.length ?? 0}
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="px-4">
                        <Button variant="outline" size="xs" asChild>
                          <Link
                            href={`/dashboard/exam/mark-entry?examId=${currentData.id}&classId=${row.classId}`}
                          >
                            Enter Marks
                            <ArrowRight data-icon="inline-end" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="progress" className="mt-0">
              <p className="p-6 text-sm text-muted-foreground">
                Mark entry progress will appear here once marks can be recorded.
              </p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
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

// --- Reusable Status Badge ---
function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={status === "ACTIVE" ? "default" : "secondary"}
      className="h-auto px-2.5 py-0.5 text-[11px] font-semibold"
    >
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </Badge>
  );
}
