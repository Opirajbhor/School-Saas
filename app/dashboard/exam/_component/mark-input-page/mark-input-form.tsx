"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PenTool,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormSelect } from "@/components/forms/form-select";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import {
  getExamClassFilters,
  getExamClassOptions,
  getExamMarkSheet,
  getExamOptions,
  saveMarkInput,
} from "../../_actions/markInput.action";
import {
  InputMarkInputSheetType,
  markInputSheetZod,
} from "../../_schema/exam.zod";
import { MarkInputTable } from "./mark-input-table";
import { StepHeading } from "./mark-input-ui";

export default function MarkInputPage() {
  const queryClient = useQueryClient();

  const form = useForm<InputMarkInputSheetType>({
    resolver: zodResolver(markInputSheetZod),
    defaultValues: {
      examId: "",
      classId: "",
      sectionId: "",
      subjectId: "",
      rows: [],
    },
  });
  const { isSubmitting } = form.formState;

  const [examId, classId, sectionId, subjectId] = useWatch({
    control: form.control,
    name: ["examId", "classId", "sectionId", "subjectId"],
  });

  // ------------- selectors -------------
  const { data: exams = [], isPending: examsLoading } = useQuery({
    queryKey: ["examMarkInput", "exam-options"],
    queryFn: async () => {
      const result = await getExamOptions();
      if (!result.success) throw new Error(String(result.error));
      return result.data as { id: string; name: string }[];
    },
  });

  const { data: classes = [], isPending: classesLoading } = useQuery({
    queryKey: ["examMarkInput", "exam-classes", examId],
    enabled: Boolean(examId),
    queryFn: async () => {
      const result = await getExamClassOptions(examId);
      if (!result.success) throw new Error(String(result.error));
      return result.data as { id: string; name: string }[];
    },
  });

  const {
    data: classFilters,
    isPending: filtersLoading,
    isError: filtersError,
  } = useQuery({
    queryKey: ["examMarkInput", "class-filters", classId],
    enabled: Boolean(classId),
    queryFn: async () => {
      const result = await getExamClassFilters(classId);
      if (!result.success) throw new Error(String(result.error));
      return result.data as {
        sections: { id: string; name: string }[];
        subjects: { id: string; name: string }[];
      };
    },
  });

  // the sheet is only fetched once all four columns are chosen
  const { data: sheet, isFetching: sheetLoading } = useQuery({
    queryKey: ["examMarkInput", "sheet", examId, classId, sectionId, subjectId],
    enabled: Boolean(examId && classId && sectionId && subjectId),
    queryFn: async () => {
      const result = await getExamMarkSheet({
        examId,
        classId,
        sectionId,
        subjectId,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const [search, setSearch] = useState("");

  // student details come from the sheet, marks from the form, same indexes
  const sheetRows = useMemo(() => sheet?.rows ?? [], [sheet]);
  const filteredIndexes = useMemo(() => {
    const rows = sheetRows.map((row, index) => ({ row, index }));
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(({ row }) =>
      `${row.roll} ${row.englishName}`.toLowerCase().includes(term),
    );
  }, [sheetRows, search]);

  // seed one row per student per configured mark type, so every
  // `rows.<i>.marks.<j>.mark` input is registered. Saved values are reused.
  useEffect(() => {
    if (!sheet) return;
    form.setValue(
      "rows",
      sheet.rows.map((row) => ({
        studentId: row.studentId,
        absent: row.marks.some((mark) => mark.absent),
        marks: sheet.markTypes.map((type) => {
          const saved = row.marks.find((mark) => mark.markTypeId === type.id);
          return {
            markTypeId: type.id,
            mark: saved?.mark ?? 0,
          };
        }),
      })),
    );
  }, [form, sheet]);

  // ------------- submit -------------
  const handleSubmit = async (data: InputMarkInputSheetType) => {
    // rows are pre-seeded with 0, so use dirty state to tell an untouched
    // student from one who legitimately scored 0 and must be saved
    const dirtyRows = form.formState.dirtyFields.rows ?? [];
    const touched = (index: number) => {
      const dirty = dirtyRows[index];
      return Boolean(dirty && (dirty.absent || dirty.marks));
    };

    const cleaned: InputMarkInputSheetType = {
      ...data,
      rows: data.rows
        .map((row, index) => ({ row, index }))
        .filter(({ row, index }) => row.absent || touched(index))
        .map(({ row }) => ({
          studentId: row.studentId,
          absent: row.absent,
          marks: row.absent ? [] : row.marks,
        })),
    };

    if (cleaned.rows.length === 0) {
      toast.error("Enter at least one mark before saving");
      return;
    }

    await handleCrudAction(saveMarkInput, cleaned, {
      successMessage: "Marks saved",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["examMarkInput"] });
      },
    });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <PenTool size={24} />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold">
                    Mark Input
                  </h1>
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
                  Choose the exam and class to see available sections and
                  subjects.
                </StepHeading>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormSelect
                    control={form.control}
                    name="examId"
                    label="Exam"
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
                    onChange={() => {
                      form.setValue("classId", "");
                      form.setValue("sectionId", "");
                      form.setValue("subjectId", "");
                      form.setValue("rows", []);
                    }}
                  />
                  <FormSelect
                    control={form.control}
                    name="classId"
                    label="Class"
                    disabled={!examId}
                    placeholder={
                      !examId
                        ? "Select an exam first"
                        : classesLoading
                          ? "Loading classes..."
                          : classes.length === 0
                            ? "No classes assigned to this exam"
                            : "Select a class"
                    }
                    options={classes.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                    onChange={() => {
                      form.setValue("sectionId", "");
                      form.setValue("subjectId", "");
                      form.setValue("rows", []);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Select Section & Subject */}
            <Card>
              <CardHeader>
                <StepHeading step="2" title="Select Section & Subject">
                  Choose a section and subject to load students and mark
                  configuration.
                </StepHeading>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormSelect
                    control={form.control}
                    name="sectionId"
                    label="Section"
                    disabled={!classId}
                    placeholder={
                      !classId
                        ? "Select a class first"
                        : filtersLoading
                          ? "Loading sections..."
                          : classFilters?.sections.length
                            ? "Select a section"
                            : "No sections for this class"
                    }
                    options={(classFilters?.sections ?? []).map((section) => ({
                      label: section.name,
                      value: section.id,
                    }))}
                  />
                  <FormSelect
                    control={form.control}
                    name="subjectId"
                    label="Subject"
                    disabled={!classId}
                    placeholder={
                      !classId
                        ? "Select a class first"
                        : filtersLoading
                          ? "Loading subjects..."
                          : classFilters?.subjects.length
                            ? "Select a subject"
                            : "No subjects assigned to this class"
                    }
                    options={(classFilters?.subjects ?? []).map((subject) => ({
                      label: subject.name,
                      value: subject.id,
                    }))}
                  />
                </div>

                {filtersError && (
                  <p className="text-sm text-destructive">
                    Failed to load sections and subjects for this class.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Enter Marks */}
            <Card>
              <CardHeader>
                <StepHeading step="3" title="Enter Marks">
                  {sheet?.classTeacher
                    ? `Class teacher: ${sheet.classTeacher.nameEnglish}`
                    : "View and enter marks for the selected section and subject."}
                </StepHeading>
                <CardAction className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {sheet
                      ? `${sheet.rows.length} students found`
                      : "No data loaded"}
                  </span>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!sheet || isSubmitting}
                  >
                    {isSubmitting ? <Spinner /> : <Save />}
                    Save Marks
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by roll or student name..."
                    className="pl-9"
                  />
                </div>

                <MarkInputTable
                  sheet={sheet}
                  isFetching={sheetLoading}
                  filteredIndexes={filteredIndexes}
                />

                <p className="text-sm text-muted-foreground">
                  Showing {filteredIndexes.length} of {sheetRows.length}{" "}
                  students
                  {form.formState.errors.rows?.root?.message
                    ? ` · ${form.formState.errors.rows.root.message}`
                    : ""}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
