"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  PenTool,
  Save,
  Search,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormSelect } from "@/components/forms/form-select";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { cn } from "@/utils/utils";
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
import { MarkInputTable, MarkInputTableLoading } from "./mark-input-table";
import { ControlField, SheetStatusBadge } from "./mark-input-ui";
import MarkEditRequestModal from "../exam-overview/mark-edit-request-modal";

type Option = { id: string; name: string };
// the exact selection a loaded sheet belongs to
type LoadedKey = {
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
};

const PAGE_SIZE = 10;

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
  const { isSubmitting, isDirty } = form.formState;

  const [examId, classId, sectionId, subjectId] = useWatch({
    control: form.control,
    name: ["examId", "classId", "sectionId", "subjectId"],
  });

  // `searched` gates step 2, `loadedKey` gates the student fetch. Neither
  // reacts to the selects on its own, so nothing loads until asked.
  const [searched, setSearched] = useState(false);
  const [loadedKey, setLoadedKey] = useState<LoadedKey | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // bump to re-run the sheet query for the same selection after a save
  const [reloadToken, setReloadToken] = useState(0);

  // ------------- option queries -------------
  const { data: exams = [], isPending: examsLoading } = useQuery({
    queryKey: ["examMarkInput", "exam-options"],
    queryFn: async () => {
      const result = await getExamOptions();
      if (!result.success) throw new Error(String(result.error));
      return result.data as Option[];
    },
  });

  const { data: classes = [], isPending: classesLoading } = useQuery({
    queryKey: ["examMarkInput", "exam-classes", examId],
    enabled: Boolean(examId),
    queryFn: async () => {
      const result = await getExamClassOptions(examId);
      if (!result.success) throw new Error(String(result.error));
      return result.data as Option[];
    },
  });

  const {
    data: classFilters,
    isPending: filtersLoading,
    isError: filtersError,
  } = useQuery({
    queryKey: ["examMarkInput", "class-filters", classId],
    enabled: searched && Boolean(classId),
    queryFn: async () => {
      const result = await getExamClassFilters(classId);
      if (!result.success) throw new Error(String(result.error));
      return result.data as { sections: Option[]; subjects: Option[] };
    },
  });

  // only fetched for the exact key the teacher loaded
  const loadedKeyRef = loadedKey;
  const {
    data: sheet,
    isFetching: sheetLoading,
    isError: sheetError,
    error: sheetErrorValue,
  } = useQuery({
    queryKey: ["examMarkInput", "sheet", loadedKeyRef, reloadToken],
    enabled: Boolean(loadedKeyRef),
    queryFn: async () => {
      if (!loadedKeyRef) throw new Error("No section and subject loaded");
      const result = await getExamMarkSheet(loadedKeyRef);
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
  });

  // ------------- seed form rows from the sheet -------------
  useEffect(() => {
    if (!sheet) return;
    form.reset({
      examId: loadedKey?.examId ?? "",
      classId: loadedKey?.classId ?? "",
      sectionId: loadedKey?.sectionId ?? "",
      subjectId: loadedKey?.subjectId ?? "",
      rows: sheet.rows.map((row) => ({
        studentId: row.studentId,
        absent: row.marks.length > 0 && row.marks.every((mark) => mark.absent),
        marks: sheet.markTypes.map((type) => {
          const saved = row.marks.find((mark) => mark.markTypeId === type.id);
          return { markTypeId: type.id, mark: saved?.mark ?? 0 };
        }),
      })),
    });
  }, [form, sheet, loadedKey]);

  // warn before leaving with unsaved marks
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ------------- selection handlers -------------
  const handleExamChange = () => {
    form.setValue("classId", "");
    resetSheet();
  };

  const handleClassChange = () => {
    form.setValue("sectionId", "");
    form.setValue("subjectId", "");
    setSearched(false);
    resetSheet();
  };

  const handleSearch = () => {
    if (!examId || !classId) {
      toast.error("Select an exam and a class first");
      return;
    }
    setSearched(true);
    resetSheet();
  };

  const handleLoadStudents = () => {
    if (!examId || !classId || !sectionId || !subjectId) {
      toast.error("Select a section and a subject first");
      return;
    }
    setSearch("");
    setPage(1);
    setLoadedKey({ examId, classId, sectionId, subjectId });
  };

  function resetSheet() {
    setLoadedKey(null);
    setSearch("");
    setPage(1);
    form.setValue("rows", []);
  }

  // ------------- derived rows -------------
  const filteredIndexes = useMemo(() => {
    const rows = sheet?.rows ?? [];
    const term = search.trim().toLowerCase();
    const all = rows.map((_, index) => index);
    if (!term) return all;
    return all.filter((index) => {
      const row = rows[index];
      return `${row.roll} ${row.englishName} ${row.banglaName ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [sheet, search]);

  const totalPages = Math.max(1, Math.ceil(filteredIndexes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleIndexes = filteredIndexes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ------------- save -------------
  const handleSave = async (intent: "DRAFT" | "SUBMITTED") => {
    if (!sheet || !loadedKey) return;
    if (sheet.entryStatus === "SUBMITTED" && intent === "SUBMITTED") {
      toast.error("These marks are already submitted");
      return;
    }

    // rows are pre-seeded with 0, so dirty state separates an untouched
    // student from one who legitimately scored 0 and must be saved
    const dirtyRows = form.formState.dirtyFields.rows ?? [];
    const touched = (index: number) => {
      const dirty = dirtyRows[index];
      return Boolean(dirty && (dirty.absent || dirty.marks));
    };

    const values = form.getValues();
    const rows = values.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row, index }) => row.absent || touched(index))
      .map(({ row }) => ({
        studentId: row.studentId,
        absent: row.absent,
        marks: row.absent ? [] : row.marks,
      }));

    if (rows.length === 0) {
      toast.error("Enter at least one mark before saving");
      return;
    }

    await handleCrudAction(
      saveMarkInput,
      { ...loadedKey, intent, rows },
      {
        successMessage:
          intent === "SUBMITTED" ? "Marks submitted" : "Draft saved",
        onSuccess: () => {
          form.reset(values);
          setReloadToken((token) => token + 1);
          queryClient.invalidateQueries({ queryKey: ["examMarkInput"] });
        },
      },
    );
  };

  const canSearch = Boolean(examId && classId);
  const canLoad = Boolean(sectionId && subjectId);
  const showSheet = Boolean(loadedKey);

  return (
    <FormProvider {...form}>
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <PenTool className="size-4.5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold">Mark Input</h1>
              <p className="text-sm text-muted-foreground">
                Select an exam, load a section, then enter marks.
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

        {/* Steps 1 & 2: compact selection controls */}
        <Card size="sm">
          <CardContent className="space-y-3">
            {/* Step 1 */}
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
                  onChange={handleExamChange}
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
                  onChange={handleClassChange}
                />
              </ControlField>

              <Button
                type="button"
                onClick={handleSearch}
                disabled={!canSearch}
                className="shrink-0"
              >
                <Search />
                Search
              </Button>
            </div>

            {/* Step 2 — only meaningful once a search has run */}
            {searched && (
              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
                <ControlField label="Section" className="w-full sm:w-64">
                  <FormSelect
                    control={form.control}
                    name="sectionId"
                    label=""
                    disabled={!classId || filtersLoading}
                    placeholder={
                      filtersLoading
                        ? "Loading sections..."
                        : classFilters?.sections.length
                          ? "Select a section"
                          : "No sections for this class"
                    }
                    options={(classFilters?.sections ?? []).map((section) => ({
                      label: section.name,
                      value: section.id,
                    }))}
                    onChange={() => resetSheet()}
                  />
                </ControlField>

                <ControlField label="Subject" className="w-full sm:w-64">
                  <FormSelect
                    control={form.control}
                    name="subjectId"
                    label=""
                    disabled={!classId || filtersLoading}
                    placeholder={
                      filtersLoading
                        ? "Loading subjects..."
                        : classFilters?.subjects.length
                          ? "Select a subject"
                          : "No subjects assigned"
                    }
                    options={(classFilters?.subjects ?? []).map((subject) => ({
                      label: subject.name,
                      value: subject.id,
                    }))}
                    onChange={() => resetSheet()}
                  />
                </ControlField>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLoadStudents}
                  disabled={!canLoad}
                  className="shrink-0"
                >
                  <Users />
                  Load Students
                </Button>
              </div>
            )}

            {filtersError && (
              <Alert variant="destructive">
                <AlertTitle>Could not load options</AlertTitle>
                <AlertDescription>
                  Sections and subjects for this class failed to load. Run the
                  search again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 3 — nothing renders until students are loaded */}
        {showSheet && (
          <Card size="sm" className="pb-0">
            <CardHeader className="border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CardTitle>
                    {sheet?.subject.name ?? "Marks"}
                    {sheet ? ` · ${sheet.section.name}` : ""}
                  </CardTitle>
                  {sheet && <SheetStatusBadge status={sheet.entryStatus} />}
                  {sheet && (
                    <span className="text-xs text-muted-foreground">
                      {sheet.exam.name} · {sheet.class.name} ·{" "}
                      {sheet.rows.length} students
                      {sheet.classTeacher
                        ? ` · ${sheet.classTeacher.nameEnglish}`
                        : ""}
                    </span>
                  )}
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

            <CardContent className="p-0">
              {sheetLoading && !sheet ? (
                <MarkInputTableLoading />
              ) : sheetError ? (
                <div className="p-6">
                  <Alert variant="destructive">
                    <AlertTitle>Could not load students</AlertTitle>
                    <AlertDescription>
                      {sheetErrorValue instanceof Error
                        ? sheetErrorValue.message
                        : "The mark sheet failed to load."}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : sheet ? (
                <>
                  {!sheet.canEdit && (
                    <div className="p-3 pb-0">
                      <Alert>
                        <AlertTitle>
                          {sheet.markWorkflow === "OPEN"
                            ? "These marks are submitted"
                            : sheet.markWorkflow === "FINALIZED"
                              ? "This exam is finalized"
                              : "Results are published"}
                        </AlertTitle>
                        <AlertDescription>
                          {sheet.markWorkflow === "OPEN"
                            ? sheet.editRequest?.status === "PENDING"
                              ? "Your edit request is awaiting admin approval."
                              : sheet.editRequest?.status === "REJECTED"
                                ? `Your edit request was rejected${
                                    sheet.editRequest.resolutionNote
                                      ? `: ${sheet.editRequest.resolutionNote}`
                                      : "."
                                  }`
                                : "Request permission to edit them."
                            : sheet.lockReason}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <MarkInputTable
                      sheet={sheet}
                      visibleIndexes={visibleIndexes}
                    />
                  </div>

                  {filteredIndexes.length === 0 && sheet.rows.length > 0 && (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No students match your search.
                    </p>
                  )}

                  {/* Footer: pagination + actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {visibleIndexes.length} of{" "}
                      {filteredIndexes.length} students
                      {isDirty ? " · unsaved changes" : ""}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => setPage(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => setPage(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>

                      <div className={cn("flex items-center gap-2")}>
                        {sheet.canEdit ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSave("DRAFT")}
                              disabled={isSubmitting || sheet.rows.length === 0}
                            >
                              {isSubmitting ? <Spinner /> : <Save />}
                              Save Draft
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleSave("SUBMITTED")}
                              disabled={
                                isSubmitting ||
                                sheet.rows.length === 0 ||
                                sheet.entryStatus === "SUBMITTED"
                              }
                            >
                              {isSubmitting ? <Spinner /> : <Send />}
                              Submit Marks
                            </Button>
                          </>
                        ) : sheet.markWorkflow === "OPEN" ? (
                          <MarkEditRequestModal
                            examId={sheet.exam.id}
                            classId={sheet.class.id}
                            sectionId={sheet.section.id}
                            subjectId={sheet.subject.id}
                            onSuccess={() =>
                              queryClient.invalidateQueries({
                                queryKey: ["examMarkInput"],
                              })
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </FormProvider>
  );
}
