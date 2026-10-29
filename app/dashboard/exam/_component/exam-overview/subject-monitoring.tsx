"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PenLine, Search, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSubjectMonitoring } from "../../_actions/monitoring.action";
import { EditRequestBadge, EntryStatusBadge } from "./monitoring-ui";
import CorrectionHistory from "./correction-history";

const PAGE_SIZE = 15;

// Student-level view of one monitored unit. Student rows are fetched only
// here, after the admin opens a specific section + subject.
export default function SubjectMonitoring({
  examId,
  classId,
  sectionId,
  subjectId,
}: {
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isPending, isError, error } = useQuery({
    queryKey: [
      "examMonitoring",
      "subject",
      examId,
      classId,
      sectionId,
      subjectId,
    ],
    queryFn: async () => {
      const result = await getSubjectMonitoring({
        examId,
        classId,
        sectionId,
        subjectId,
      });
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
  });

  const filtered = useMemo(() => {
    const rows = data?.students ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((student) =>
      `${student.roll} ${student.englishName} ${student.banglaName ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (isPending) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Spinner />
        Loading students...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load subject monitoring</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load data."}
        </AlertDescription>
      </Alert>
    );
  }

  const { summary, students } = data;

  return (
    <div className="space-y-6">
      {/* Header / context */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">{data.subject.name}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span>
                  {data.class.name} · {data.section.name}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>
                  Teacher:{" "}
                  {data.teacher ? data.teacher.nameEnglish : "Not assigned"}
                </span>
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntryStatusBadge status={data.entryStatus} />
              {data.editRequest && (
                <EditRequestBadge status={data.editRequest.status} />
              )}
              {data.canEdit ? (
                <Button size="sm" asChild>
                  <Link
                    href={`/dashboard/exam/mark-input?examId=${examId}&classId=${classId}&sectionId=${sectionId}&subjectId=${subjectId}`}
                  >
                    <PenLine />
                    Correct Marks
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <PenLine />
                  Marks Locked
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/exam/${examId}`}>
                  <ArrowLeft />
                  Back
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Eligible Students" value={summary.eligibleStudents} />
          <Stat label="Required Marks" value={summary.requiredMarks} />
          <Stat label="Entered Marks" value={summary.enteredMarks} />
          <Stat label="Missing Marks" value={summary.missingMarks} danger />
          <Stat label="Absent" value={summary.absentStudents} />
          <Stat label="Completion" value={`${summary.completion}%`} />
        </CardContent>
      </Card>

      {/* Lock explanation */}
      {!data.canEdit && (
        <Alert>
          <AlertTitle>These marks are submitted</AlertTitle>
          <AlertDescription>
            {data.editRequest?.status === "PENDING"
              ? "An edit request is awaiting admin approval."
              : data.editRequest?.status === "REJECTED"
                ? `Your last edit request was rejected${
                    data.editRequest.resolutionNote
                      ? `: ${data.editRequest.resolutionNote}`
                      : "."
                  }`
                : "Request permission to edit, or ask an admin to correct them."}
          </AlertDescription>
        </Alert>
      )}

      {students.length === 0 ? (
        <p className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No active students are enrolled in this section.
        </p>
      ) : data.markTypes.length === 0 ? (
        <Alert>
          <AlertTitle>No mark types configured</AlertTitle>
          <AlertDescription>
            This subject has no mark types (such as CQ or MCQ) set up, so there
            is nothing to enter and completion cannot be measured. Add them
            under Exam Settings → Mark Config for this subject.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Student Marks</CardTitle>
                <CardDescription>
                  {summary.studentsWithMissingMarks} student
                  {summary.studentsWithMissingMarks === 1 ? "" : "s"} still have
                  missing marks.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search roll or name..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-16 text-center">Roll</TableHead>
                  <TableHead className="min-w-44">Student Name</TableHead>
                  {data.markTypes.map((type) => (
                    <TableHead key={type.id} className="w-24 text-center">
                      {type.name}
                      <span className="block text-[10px] font-normal text-muted-foreground">
                        /{type.fullMark}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="w-24 text-center">Entered</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4 + data.markTypes.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No students match your search.
                    </TableCell>
                  </TableRow>
                )}

                {visible.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="text-center text-muted-foreground">
                      {student.roll}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {student.englishName}
                      {student.banglaName && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {student.banglaName}
                        </span>
                      )}
                    </TableCell>

                    {student.marks.map((mark) => (
                      <TableCell
                        key={mark.markTypeId}
                        className="text-center tabular-nums"
                      >
                        {mark.absent ? (
                          <Badge variant="outline" className="text-[11px]">
                            Absent
                          </Badge>
                        ) : student.entered === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          mark.mark
                        )}
                      </TableCell>
                    ))}

                    <TableCell className="text-center text-xs text-muted-foreground">
                      {student.entered}/{student.required}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.complete ? (
                        student.absent ? (
                          <Badge variant="outline" className="text-[11px]">
                            Absent
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px]">
                            Complete
                          </Badge>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                          <UserX size={12} />
                          {student.missing} missing
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
            <p className="text-xs text-muted-foreground">
              Showing {visible.length} of {filtered.length} students
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Audit trail for this unit */}
      <CorrectionHistory
        examId={examId}
        classId={classId}
        sectionId={sectionId}
        subjectId={subjectId}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          danger && Number(value) > 0 ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
