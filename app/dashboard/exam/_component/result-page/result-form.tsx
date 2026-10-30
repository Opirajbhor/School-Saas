"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ClipboardList, Search } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { FormSelect } from "@/components/forms/form-select";
import { DataTable } from "@/components/table/tanstack/data-table";
import {
  getExamClassOptions,
  getExamOptions,
} from "../../_actions/markInput.action";
import { getExamResult } from "../../_actions/result.action";
import {
  InputResultQueryType,
  resultQueryZod,
} from "../../_schema/exam.zod";
import { MarkWorkflowBadge } from "../exam-overview/monitoring-ui";
import { resultColumns } from "./result-columns";
import { IncompleteMarksPanel } from "./result-ui";
import ResultReview from "./result-review";
import { ReportLinks } from "./report-links";

type Option = { id: string; name: string };
// the exact exam + class a loaded result sheet belongs to
type LoadedKey = { examId: string; classId: string };

export default function ResultForm() {
  const form = useForm<InputResultQueryType>({
    resolver: zodResolver(resultQueryZod),
    defaultValues: { examId: "", classId: "" },
  });

  const [examId, classId] = useWatch({
    control: form.control,
    name: ["examId", "classId"],
  });

  // the table only renders for the exact selection that was loaded
  const [loadedKey, setLoadedKey] = useState<LoadedKey | null>(null);
  const [sectionFilter, setSectionFilter] = useState("");

  // changing either select drops the loaded sheet, so a stale result can never
  // sit under a different exam or class
  const resetSheet = () => {
    setLoadedKey(null);
    setSectionFilter("");
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

  // only publish/unpublish once a sheet is actually loaded, since the action
  // needs the exam + class the review was for
  const reviewKey = sheet && loadedKey ? loadedKey : null;

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
                Select an exam and class to calculate totals, grades and positions.
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
              <ControlField label="Exam" className="w-full sm:w-64">
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

              <ControlField label="Class" className="w-full sm:w-64">
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

              <Button
                type="button"
                onClick={() => setLoadedKey({ examId, classId })}
                disabled={!canSearch}
                className="shrink-0"
              >
                <Search />
                Calculate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results — nothing renders until a calculation is run */}
        {loadedKey && (
          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CardTitle>
                    {sheet ? `${sheet.exam.name} · ${sheet.class.name}` : "Results"}
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

                {sheet && sheet.sections.length > 1 && (
                  <select
                    value={sectionFilter}
                    onChange={(event) => setSectionFilter(event.target.value)}
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">All sections</option>
                    {sheet.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        Section {section.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
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
                  {reviewKey && sheet && (
                    <ResultReview
                      examId={reviewKey.examId}
                      classId={reviewKey.classId}
                      workflow={sheet.exam.markWorkflow}
                      fromSnapshot={Boolean(sheet.fromSnapshot)}
                      snapshotVersion={sheet.snapshotVersion}
                    />
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
                      No active students are enrolled in this class.
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
