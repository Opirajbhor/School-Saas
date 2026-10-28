"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Book,
  CheckCircle2,
  MoreHorizontal,
  PenTool,
  Save,
  Search,
  Send,
  Users,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STUDENT_MARKS: {
  roll: string;
  name: string;
  cq: string;
  mcq: string;
  total: string;
  cqStatus: MarkStatus;
  mcqStatus: MarkStatus;
  remark?: string;
}[] = [
  { roll: "1", name: "Aarav Sharma", cq: "58", mcq: "26", total: "84" },
  { roll: "2", name: "Diya Patel", cq: "45", mcq: "20", total: "65" },
  { roll: "3", name: "Rohan Verma", cq: "62", mcq: "28", total: "90" },
  { roll: "4", name: "Sneha Gupta", cq: "50", mcq: "22", total: "72" },
  {
    roll: "5",
    name: "Aditya Singh",
    cq: "38",
    mcq: "15",
    total: "53",
    remark: "Needs attention",
  },
  { roll: "6", name: "Ananya Mishra", cq: "70", mcq: "30", total: "100" },
  {
    roll: "7",
    name: "Kartik Roy",
    cq: "N/A",
    mcq: "N/A",
    total: "-",
    remark: "Absent",
  },
  { roll: "8", name: "Ishita Das", cq: "55", mcq: "25", total: "80" },
  { roll: "9", name: "Vivaan Jain", cq: "42", mcq: "18", total: "60" },
  { roll: "10", name: "Tanya Kapoor", cq: "67", mcq: "27", total: "94" },
].map((student) => ({
  ...student,
  cqStatus: toMarkStatus(student.cq, 23),
  mcqStatus: toMarkStatus(student.mcq, 10),
}));

function toMarkStatus(value: string, passMark: number): MarkStatus {
  if (value === "N/A") return "absent";
  return Number(value) < passMark ? "below" : "present";
}

const PAGES = [1, 2, 3, 4];
const CURRENT_PAGE = 1;

export default function MarkInputPage() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <PenTool size={24} />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Mark Input</h1>
              <p className="text-sm text-muted-foreground">
                Enter and manage student marks for exams.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/exam">
              <ArrowLeft />
              Back to Exams
            </Link>
          </Button>
        </div>

        {/* Step 1: Select Exam & Class */}
        <Card>
          <CardHeader>
            <StepHeading step="1" title="Select Exam & Class">
              Choose the exam and class to see available sections and subjects.
            </StepHeading>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Exam</p>
                <NativeSelect className="w-full" defaultValue="half-yearly">
                  <NativeSelectOption value="half-yearly">
                    Half-Yearly Examination (2024-25)
                  </NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Class</p>
                <NativeSelect className="w-full" defaultValue="class-10">
                  <NativeSelectOption value="class-10">Class 10</NativeSelectOption>
                </NativeSelect>
              </div>
              <Button type="button" className="md:h-8">
                <Search />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Section & Subject */}
        <Card>
          <CardHeader>
            <StepHeading step="2" title="Select Section & Subject">
              Choose a section and subject from the list below. Search again to
              load students and mark configuration.
            </StepHeading>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Section</p>
                <NativeSelect className="w-full" defaultValue="section-a">
                  <NativeSelectOption value="section-a">
                    Section A
                  </NativeSelectOption>
                  <NativeSelectOption value="section-b">
                    Section B
                  </NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Subject</p>
                <NativeSelect className="w-full" defaultValue="mathematics">
                  <NativeSelectOption value="mathematics">
                    Mathematics
                  </NativeSelectOption>
                </NativeSelect>
              </div>
              <Button type="button">
                <Search />
                Search
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                icon={<Users size={18} />}
                title="Available Sections"
                value="2"
                subtext="Section A, Section B"
              />
              <SummaryCard
                icon={<Book size={18} />}
                title="Available Subjects"
                value="5"
                subtext="Mathematics, Physics, Chemistry..."
              />
              <SummaryCard
                icon={<CheckCircle2 size={18} />}
                title="Mark Configuration"
                value="CQ: 70 / MCQ: 30"
                subtext="Pass marks: CQ 23, MCQ 10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Enter Marks */}
        <Card>
          <CardHeader>
            <StepHeading step="3" title="Enter Marks">
              View and enter marks for the selected section and subject.
            </StepHeading>
            <CardAction className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {STUDENT_MARKS.length} students found
              </span>
              <Button type="button" variant="outline" size="sm">
                <Save />
                Save Draft
              </Button>
              <Button type="button" size="sm">
                <Send />
                Submit Marks
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by roll or student name..."
                className="pl-9"
              />
            </div>

            <Table className="rounded-lg border border-border [&_table]:rounded-lg">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead rowSpan={2} className="w-16 text-center">
                    Roll No.
                  </TableHead>
                  <TableHead rowSpan={2} className="min-w-40">
                    Student Name
                  </TableHead>
                  <TableHead colSpan={2} className="text-center">
                    CQ (70)
                  </TableHead>
                  <TableHead colSpan={2} className="text-center">
                    MCQ (30)
                  </TableHead>
                  <TableHead rowSpan={2} className="w-20 text-center">
                    Total{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      / 100
                    </span>
                  </TableHead>
                  <TableHead rowSpan={2} className="min-w-32">
                    Remarks
                  </TableHead>
                  <TableHead rowSpan={2} className="w-12 text-center">
                    Action
                  </TableHead>
                </TableRow>
                <TableRow>
                  {["Marks", "Status", "Marks", "Status"].map((label) => (
                    <TableHead key={label} className="w-24 text-center">
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {STUDENT_MARKS.map((student) => (
                  <TableRow key={student.roll}>
                    <TableCell className="text-center text-muted-foreground">
                      {student.roll}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {student.name}
                    </TableCell>
                    <MarkCell label="CQ marks" value={student.cq} />
                    <TableCell className="text-center">
                      <MarkStatusBadge status={student.cqStatus} />
                    </TableCell>
                    <MarkCell label="MCQ marks" value={student.mcq} />
                    <TableCell className="text-center">
                      <MarkStatusBadge status={student.mcqStatus} />
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">
                      {student.total}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {student.remark ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`More actions for ${student.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Showing 1-{STUDENT_MARKS.length} of {STUDENT_MARKS.length}{" "}
                students
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  disabled
                  aria-label="Previous page"
                >
                  <ArrowLeft />
                </Button>
                {PAGES.map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={page === CURRENT_PAGE ? "default" : "outline"}
                    size="icon-xs"
                    aria-current={page === CURRENT_PAGE ? "page" : undefined}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  aria-label="Next page"
                >
                  <ArrowRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type MarkStatus = "present" | "below" | "absent";

// --- Step heading with numbered badge ---
function StepHeading({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {step}
      </div>
      <div className="space-y-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{children}</CardDescription>
      </div>
    </div>
  );
}

// --- Summary card used in step 2 ---
function SummaryCard({
  icon,
  title,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 ring-1 ring-border">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{subtext}</p>
      </div>
    </div>
  );
}

// --- Marks input / absent placeholder cell ---
function MarkCell({ label, value }: { label: string; value: string }) {
  return (
    <TableCell className="text-center">
      {value === "N/A" ? (
        <span className="text-muted-foreground">N/A</span>
      ) : (
        <Input
          type="text"
          inputMode="numeric"
          defaultValue={value}
          aria-label={label}
          className="mx-auto w-14 text-center"
        />
      )}
    </TableCell>
  );
}

// --- Reusable Status Badge ---
function MarkStatusBadge({ status }: { status: MarkStatus }) {
  if (status === "below") {
    return (
      <Badge variant="destructive" className="text-[11px]">
        Below Pass
      </Badge>
    );
  }
  if (status === "absent") {
    return (
      <Badge variant="outline" className="text-[11px]">
        Absent
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[11px]">
      Present
    </Badge>
  );
}
