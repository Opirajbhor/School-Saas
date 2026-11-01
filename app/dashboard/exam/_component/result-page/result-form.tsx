"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FcTodoList as ClipboardList } from "react-icons/fc";
import {
  IoChevronBackOutline as ChevronLeft,
  IoSearchOutline as Search,
} from "react-icons/io5";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { FormSelect } from "@/components/forms/form-select";
import { DataTable } from "@/components/table/tanstack/data-table";
import {
  getExamClassOptions,
  getExamOptions,
} from "../../_actions/markInput.action";
import {
  getClassSectionOptions,
  getExamResult,
} from "../../_actions/result.action";
import {
  InputResultQueryType,
  resultQueryZod,
} from "../../_schema/exam.zod";
import { MarkWorkflowBadge } from "../exam-overview/monitoring-ui";
import { resultColumns } from "./result-columns";
import { IncompleteMarksPanel } from "./result-ui";
import { ReportLinks } from "./report-links";

type Option = { id: string; name: string };
// the exact exam + class a loaded result sheet belongs to
type LoadedKey = { examId: string; classId: string };
type SheetStudent = {
  sectionId: string;
  GPA: number;
  passed: boolean;
  classRank: number;
};

const ALL_SECTIONS = "all";

export default function ResultForm() {
  const form = useForm<InputResultQueryType>({
    resolver: zodResolver(resultQueryZod),
    defaultValues: { examId: "", classId: "" },
  });

  const [examId, classId] = useWatch({
    control: form.control,
    name: ["examId", "classId"],
  });

  // chosen in the search bar, applied when Calculate is pressed
  const [sectionChoice, setSectionChoice] = useState(ALL_SECTIONS);
  // the table only renders for the exact selection that was loaded
  const [loadedKey, setLoadedKey] = useState<LoadedKey | null>(null);
  const [sectionFilter, setSectionFilter] = useState("");

  const resetSheet = () => {
    setLoadedKey(null);
    setSectionFilter("");
    setSectionChoice(ALL_SECTIONS);
  };

  const { data: exams = [], isPending: examsLoading } = useQuery({
    queryKey: ["examResult", "exam-options"],
    queryFn: async () => {
      const result = await getExamOptions();
      if (!result.success) throw new Error(String(result.error));
      return result.data as Option[];
    },
  });

  const { data: classes = [], isPending: classesLoading } = useQuery({
    queryKey: ["examResult", "exam-classes", examId],
    enabled: Boolean(examId),
    queryFn: async () => {
      const result = await getExamClassOptions(examId);
      if (!result.success) throw new Error(String(result.error));
      return result.data as Option[];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["examResult", "class-sections", classId],
    enabled: Boolean(classId),
    queryFn: async () => {
      const result = await getClassSectionOptions(classId);
      if (!result.success) return [] as Option[];
      return result.data as Option[];
    },
  });

  const {
    data: sheet,
    isFetching: sheetLoading,
    isError: sheetError,
  } = useQuery({
    queryKey: ["examResult", "sheet", loadedKey],
    enabled: Boolean(loadedKey),
    queryFn: async () => {
      if (!loadedKey) throw new Error("No exam and class loaded");
      const result = await getExamResult(loadedKey);
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
  });

  const canSearch = Boolean(examId && classId);

  const students = sheet
    ? sectionFilter
      ? sheet.students.filter((row) => row.sectionId === sectionFilter)
      : sheet.students
    : [];

  const chosenSection = sections.find((row) => row.id === sectionChoice);
  const sectionLabel =
    sectionChoice === ALL_SECTIONS
      ? "All sections"
      : chosenSection
        ? `Section ${chosenSection.name}`
        : "All sections";

  const activeSection = sections.find((row) => row.id === sectionFilter);
  const activeSectionName =
    activeSection?.name ??
    sheet?.sections.find((row) => row.id === sectionFilter)?.name ??
    null;

  const reviewKey = sheet && loadedKey ? loadedKey : null;

  const runSearch = () => {
    setSectionFilter(
      sectionChoice === ALL_SECTIONS ? "" : sectionChoice,
    );
    setLoadedKey({ examId, classId });
  };

  return (
    <FormProvider {...form}>
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ClipboardList className="size-4.5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold">Exam Results</h1>
              <p className="text-sm text-muted-foreground">
                Pick an exam, class and section to calculate totals, grades and
                positions.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/exam">
              <ChevronLeft />
              Back to Exams
            </Link>
          </Button>
        </div>

        {/* Selection */}
        <Card size="sm">
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              <ControlField label="Exam" className="w-full sm:w-56">
                <FormSelect
                  control={form.control}
                  name="examId"
                  label=""
                  placeholder={
                    examsLoading
                      ? "Loading exams..."
                      : exams.length === 0
                        ? "No exams assigned"
                        : "Select an exam"
                  }
                  options={exams.map((exam) => ({
                    label: exam.name,
                    value: exam.id,
                  }))}
                  onChange={resetSheet}
                />
              </ControlField>

              <ControlField label="Class" className="w-full sm:w-56">
                <FormSelect
                  control={form.control}
                  name="classId"
                  label=""
                  disabled={!examId}
                  placeholder={
                    !examId
                      ? "Select an exam first"
                      : classesLoading
                        ? "Loading classes..."
                        : classes.length === 0
                          ? "No classes assigned"
                          : "Select a class"
                  }
                  options={classes.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  onChange={resetSheet}
                />
              </ControlField>

              <ControlField label="Section" className="w-full sm:w-44">
                <Select
                  value={sectionChoice}
                  onValueChange={(value) => setSectionChoice(value ?? ALL_SECTIONS)}
                  disabled={!classId || sections.length === 0}
                >
                  <SelectTrigger className="h-9 w-full">
                    {/* radix only renders the item text once the menu has been
                        opened, so the label is passed in explicitly */}
                    <SelectValue placeholder="All sections">
                      {sectionLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SECTIONS}>All sections</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        Section {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlField>

              <Button
                type="button"
                onClick={runSearch}
                disabled={!canSearch || sheetLoading}
                className="shrink-0"
              >
                {sheetLoading ? <Spinner /> : <Search />}
                Calculate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results — nothing renders until a calculation is run */}
        {loadedKey && (
          <Card className="gap-0 py-0">
            <CardHeader className="gap-3 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CardTitle>
                    {sheet
                      ? `${sheet.exam.name} · ${sheet.class.name}${
                          activeSectionName ? ` · Section ${activeSectionName}` : ""
                        }`
                      : "Results"}
                  </CardTitle>
                  {sheet && <MarkWorkflowBadge workflow={sheet.exam.markWorkflow} />}
                  {sheet?.fromSnapshot && (
                    <Badge
                      variant="outline"
                      className="h-auto px-1.5 py-0 text-[11px]"
                    >
                      published snapshot v{sheet.snapshotVersion}
                    </Badge>
                  )}
                  {sheet && (
                    <span className="text-xs text-muted-foreground">
                      {students.length} students · {sheet.subjects.length} subjects
                    </span>
                  )}
                </div>
              </div>

              {/* switch sections without recalculating */}
              {sheet && sheet.sections.length > 1 && (
                <div className="flex flex-wrap items-center gap-1">
                  <SectionChip
                    active={!sectionFilter}
                    onClick={() => setSectionFilter("")}
                    label={`All · ${sheet.students.length}`}
                  />
                  {sheet.sections.map((section) => (
                    <SectionChip
                      key={section.id}
                      active={sectionFilter === section.id}
                      onClick={() => setSectionFilter(section.id)}
                      label={`Section ${section.name} · ${
                        sheet.students.filter(
                          (row) => row.sectionId === section.id,
                        ).length
                      }`}
                    />
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              {sheetLoading && !sheet ? (
                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <Spinner />
                  Calculating results...
                </div>
              ) : sheetError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not calculate results</AlertTitle>
                  <AlertDescription>
                    The result sheet for this exam and class failed to load. Try
                    again.
                  </AlertDescription>
                </Alert>
              ) : sheet ? (
                <>
                  {students.length > 0 && (
                    <ResultSummary students={students as SheetStudent[]} />
                  )}

                  <IncompleteMarksPanel
                    incomplete={sheet.incomplete}
                    sections={sheet.sections}
                  />

                  {reviewKey && (
                    <ReportLinks
                      examId={reviewKey.examId}
                      classId={reviewKey.classId}
                      sectionId={sectionFilter || undefined}
                    />
                  )}

                  {students.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No active students are enrolled in this{" "}
                      {sectionFilter ? "section" : "class"}.
                    </p>
                  ) : (
                    <DataTable
                      columns={resultColumns(sheet.subjects)}
                      data={students}
                      filterColumn="englishName"
                      filterPlaceholder="Search roll or name..."
                    />
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </FormProvider>
  );
}

/** At-a-glance numbers for whatever the table is currently showing. */
function ResultSummary({ students }: { students: SheetStudent[] }) {
  const stats = useMemo(() => {
    const total = students.length;
    const passed = students.filter((row) => row.passed).length;
    const average = total
      ? students.reduce((sum, row) => sum + row.GPA, 0) / total
      : 0;
    const top = total
      ? students.reduce(
          (best, row) => (row.GPA > best.GPA ? row : best),
          students[0],
        )
      : null;

    return {
      total,
      passed,
      percent: total ? Math.round((passed / total) * 100) : 0,
      average,
      top,
    };
  }, [students]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Tile label="Students" value={String(stats.total)} />
      <Tile
        label="Passed"
        value={`${stats.passed} · ${stats.percent}%`}
        tone={stats.passed === stats.total ? "good" : undefined}
      />
      <Tile label="Average GPA" value={stats.average.toFixed(2)} />
      <Tile
        label="Top GPA"
        value={stats.top ? stats.top.GPA.toFixed(2) : "—"}
      />
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good";
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={
          tone === "good"
            ? "text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-500"
            : "text-lg font-semibold tabular-nums text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

function SectionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-foreground"
          : "rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
      }
    >
      {label}
    </button>
  );
}

// label above a select, matching the mark input page
function ControlField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
