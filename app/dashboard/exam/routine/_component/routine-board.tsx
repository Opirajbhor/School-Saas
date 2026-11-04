"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarPlus,
  Check,
  CopySimple,
  Plus,
  Trash,
  PencilSimple,
} from "@phosphor-icons/react/ssr";
import { cn } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/date";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import {
  examRoutineSlotZod,
  InputExamRoutineSlotType,
} from "../../_schema/routine.zod";
import {
  copyRoutineDay,
  copyRoutineSlot,
  deleteRoutineSlot,
  ExamRoutinePayload,
  RoutineSlot,
  saveRoutineNotice,
  saveRoutineSlot,
  saveRoutineSlots,
} from "../../_actions/routine.action";

const prettyDate = (iso: string) => formatDate(iso);

// A school runs the same clock for every paper, so the last times used are the
// default for the next one — nobody wants to retype 10:30 – 13:30 every time.
const TIME_STORAGE_KEY = "educare:routine-times";
const DEFAULT_TIMES = { startsAt: "10:30", endsAt: "13:30" };

type RoutineTimes = { startsAt: string; endsAt: string };

const readTimes = (): RoutineTimes => {
  if (typeof window === "undefined") return DEFAULT_TIMES;
  try {
    const raw = window.localStorage.getItem(TIME_STORAGE_KEY);
    if (!raw) return DEFAULT_TIMES;
    const parsed = JSON.parse(raw) as RoutineTimes;
    return parsed.startsAt && parsed.endsAt ? parsed : DEFAULT_TIMES;
  } catch {
    return DEFAULT_TIMES;
  }
};

const emptySlot = (
  examId: string,
  times: RoutineTimes = DEFAULT_TIMES,
): InputExamRoutineSlotType =>
  ({
    examId,
    classId: "",
    subjectId: "",
    kind: "THEORY",
    examDate: "",
    startsAt: times.startsAt,
    endsAt: times.endsAt,
    sectionId: null,
    note: "",
  }) as InputExamRoutineSlotType;


/** Free-text instructions printed under the routine (admit card, reporting time). */
function NoticeCard({ examId, notice }: { examId: string; notice: string }) {
  const router = useRouter();
  const [value, setValue] = useState(notice);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await handleCrudAction(
      saveRoutineNotice,
      { examId, notice: value },
      {
        successMessage: value.trim() ? "Notice saved" : "Notice cleared",
        onSuccess: () => router.refresh(),
      },
    );
    setSaving(false);
    if (!res.success) return;
  };

  const dirty = value !== notice;

  return (
    <Card className="space-y-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Notice</p>
          <p className="text-xs text-muted-foreground">
            Printed under the routine — reporting time, admit card, calculators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {value.length}/1200
          </span>
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving && <Spinner />}
            Save notice
          </Button>
        </div>
      </div>

      <Textarea
        value={value}
        maxLength={1200}
        onChange={(event) => setValue(event.target.value)}
        placeholder={
          "e.g. Students must bring their admit card.\nReport to the exam hall 15 minutes before the start time."
        }
        rows={3}
        className="resize-y text-sm"
      />
    </Card>
  );
}

/**
 * The routine matrix. Rows are dates, columns are the classes the exam was
 * assigned to, and each cell holds the papers sat that day — a theory paper on
 * one line, a practical (which is sat per section) on its own line below.
 */
export function RoutineBoard({
  exams,
  examId,
  data,
}: {
  exams: { label: string; value: string }[];
  examId: string;
  data: ExamRoutinePayload;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<InputExamRoutineSlotType>(
    emptySlot(examId),
  );
  const [pendingDelete, setPendingDelete] = useState<RoutineSlot | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [copySource, setCopySource] = useState<RoutineSlot | null>(null);
  const [copyTargets, setCopyTargets] = useState<string[]>([]);
  const [copyDayFrom, setCopyDayFrom] = useState<string | null>(null);
  const [copyDayTo, setCopyDayTo] = useState("");

  const form = useForm<InputExamRoutineSlotType>({
    resolver: zodResolver(examRoutineSlotZod),
    defaultValues: formValues,
    // the dialog swaps the whole object between "new" and "edit"
    values: formValues,
  });
  const { isSubmitting } = form.formState;
  const classId = useWatch({ control: form.control, name: "classId" });

  // the subject list is what *every* selected class studies, so one save can
  // create a valid sitting for all of them
  const subjectsForClass = useMemo(() => {
    const classesToCheck = selectedClasses.length > 0 ? selectedClasses : [];
    if (classesToCheck.length === 0) return [];

    const shared = data.subjects.filter((subject) =>
      classesToCheck.every((id) =>
        data.subjects.some(
          (other) => other.id === subject.id && other.classId === id,
        ),
      ),
    );
    const seen = new Set<string>();
    return shared
      .filter((subject) => {
        if (seen.has(subject.id)) return false;
        seen.add(subject.id);
        return true;
      })
      .map((subject) => ({ label: subject.name, value: subject.id }));
  }, [data.subjects, selectedClasses]);

  const sectionsForClass = useMemo(
    () =>
      data.sections
        .filter((section) => section.classId === classId)
        .map((section) => ({ label: section.name, value: section.id })),
    [data.sections, classId],
  );

  // dates down the side, ascending, with every class's slot on that date
  const dates = useMemo(() => {
    const map = new Map<string, RoutineSlot[]>();
    for (const row of data.rows) {
      const list = map.get(row.examDate) ?? [];
      list.push(row);
      map.set(row.examDate, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data.rows]);

  const openNew = (patch?: Partial<InputExamRoutineSlotType>) => {
    setSelectedClasses(patch?.classId ? [patch.classId] : []);
    // the last times that were saved are the default for the next paper
    setFormValues({ ...emptySlot(examId, readTimes()), ...patch });
    setOpen(true);
  };

  const openCopy = (slot: RoutineSlot) => {
    setCopySource(slot);
    // every other class that studies the subject is preselected: that is the
    // common case, and unticking one is faster than ticking four
    const studiers = data.subjects
      .filter((subject) => subject.id === slot.subjectId)
      .map((subject) => subject.classId);
    setCopyTargets(
      data.classes
        .filter(
          (klass) => klass.id !== slot.classId && studiers.includes(klass.id),
        )
        .map((klass) => klass.id),
    );
  };

  const runCopy = async () => {
    if (!copySource) return;
    const res = await handleCrudAction(
      copyRoutineSlot,
      { slotId: copySource.id, classIds: copyTargets },
      {
        successMessage: "Copied to the selected classes",
        onSuccess: () => {
          router.refresh();
          setCopySource(null);
        },
      },
    );
    if (!res.success) setCopySource(null);
  };

  const runCopyDay = async () => {
    if (!copyDayFrom) return;
    const res = await handleCrudAction(
      copyRoutineDay,
      { examId, fromDate: copyDayFrom, toDate: copyDayTo },
      {
        successMessage: "Day copied",
        onSuccess: () => {
          router.refresh();
          setCopyDayFrom(null);
          setCopyDayTo("");
        },
      },
    );
    if (!res.success) setCopyDayFrom(null);
  };

  const openEdit = (slot: RoutineSlot) => {
    setSelectedClasses([slot.classId]);
    setFormValues({
      id: slot.id,
      examId,
      classId: slot.classId,
      sectionId: slot.sectionId,
      subjectId: slot.subjectId,
      kind: slot.kind,
      examDate: slot.examDate,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      note: slot.note ?? "",
    } as InputExamRoutineSlotType);
    setOpen(true);
  };

  const save = async (values: InputExamRoutineSlotType) => {
    const payload = {
      ...values,
      examId,
      sectionId: values.sectionId ? values.sectionId : null,
      note: values.note?.trim() ? values.note : null,
    } as InputExamRoutineSlotType;

    // editing moves one row; adding writes one row per selected class
    const action = values.id
      ? saveRoutineSlot
      : selectedClasses.length > 1
        ? (data: InputExamRoutineSlotType) =>
            saveRoutineSlots({
              ...data,
              classId: selectedClasses[0],
              classIds: selectedClasses,
            } as never)
        : saveRoutineSlot;

    const res = await handleCrudAction(action, payload, {
      successMessage: values.id ? "Sitting updated" : "Sitting added",
      onSuccess: () => {
        // next "add sitting" starts from these times
        const saved = { startsAt: values.startsAt, endsAt: values.endsAt };
        try {
          window.localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(saved));
        } catch {
          // private mode: the defaults still apply
        }
        router.refresh();
        setOpen(false);
      },
    });
    if (!res.success) return;
  };

  const remove = async () => {
    if (!pendingDelete) return;
    const res = await handleCrudAction(
      ({ id }: { id: string }) => deleteRoutineSlot(id),
      { id: pendingDelete.id },
      {
        successMessage: "Sitting removed",
        onSuccess: () => {
          router.refresh();
          setPendingDelete(null);
        },
      },
    );
    if (!res.success) setPendingDelete(null);
  };

  const theoryCount = data.rows.filter((row) => row.kind === "THEORY").length;
  const practicalCount = data.rows.length - theoryCount;

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex min-w-56 flex-1 items-center gap-2">
          <Combobox
            options={exams}
            value={examId}
            onValueChange={(value) =>
              value && router.push(`/dashboard/exam/routine?exam=${value}`)
            }
            placeholder="Choose an exam"
            searchPlaceholder="Search exams…"
            className="w-full sm:max-w-xs"
          />
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {data.rows.length}
            </span>{" "}
            sittings ·{" "}
            <span className="font-medium text-foreground tabular-nums">
              {dates.length}
            </span>{" "}
            days
            {practicalCount > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {practicalCount}
                </span>{" "}
                practical
              </>
            )}
          </p>
          <Button size="sm" onClick={() => openNew()}>
            <Plus />
            Add sitting
          </Button>
        </div>
      </Card>

      {data.rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            This exam has no routine yet
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Add the first paper — date, start and end time, and the subject. The
            board fills in as you go.
          </p>
          <Button size="sm" className="mt-2" onClick={() => openNew()}>
            <Plus />
            Add first sitting
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="sticky left-0 z-10 w-10 bg-muted/40 px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="sticky left-10 z-10 min-w-32 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                  {data.classes.map((klass) => (
                    <th
                      key={klass.id}
                      className="min-w-40 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                    >
                      {klass.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dates.map(([date, slots], rowIndex) => (
                  <tr key={date} className="border-b last:border-0">
                    <td className="sticky left-0 z-10 w-10 bg-card px-2 py-2 text-right align-top text-[11px] text-muted-foreground tabular-nums">
                      {rowIndex + 1}
                    </td>
                    <td className="sticky left-10 z-10 bg-card px-3 py-2 align-top">
                      <p className="text-xs font-medium text-foreground">
                        {prettyDate(date)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCopyDayFrom(date);
                          setCopyDayTo("");
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                        title="Copy this whole day to another date"
                      >
                        <CalendarPlus className="size-3" />
                        Copy day
                      </button>
                    </td>
                    {data.classes.map((klass) => {
                      const cell = slots.filter(
                        (slot) => slot.classId === klass.id,
                      );
                      return (
                        <td
                          key={klass.id}
                          className="group/cell px-2 py-2 align-top"
                        >
                          {cell.length === 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                openNew({
                                  examDate: date,
                                  classId: klass.id,
                                })
                              }
                              className="flex h-6 w-full items-center justify-center rounded text-xs text-muted-foreground/0 outline-none transition-colors group-hover/cell:bg-muted/60 group-hover/cell:text-muted-foreground focus-visible:text-muted-foreground"
                              title={`Add a paper for ${klass.name} on ${date}`}
                            >
                              <Plus className="size-3.5" />
                            </button>
                          ) : (
                            <div className="space-y-1">
                              {cell.map((slot) => (
                                <div
                                  key={slot.id}
                                  className="group/item flex items-start justify-between gap-1 rounded border bg-muted/30 px-2 py-1"
                                >
                                  <button
                                    type="button"
                                    onClick={() => openEdit(slot)}
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <p className="text-xs leading-snug font-medium break-words text-foreground">
                                      {slot.subjectName}
                                      {slot.kind === "PRACTICAL" && (
                                        <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
                                          P
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground tabular-nums">
                                      {slot.startsAt} – {slot.endsAt}
                                      {slot.sectionName
                                        ? ` · ${slot.sectionName}`
                                        : ""}
                                    </p>
                                    {slot.note && (
                                      <p className="truncate text-[11px] text-muted-foreground">
                                        {slot.note}
                                      </p>
                                    )}
                                  </button>
                                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100">
                                    <button
                                      type="button"
                                      onClick={() => openCopy(slot)}
                                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                                      title="Copy to other classes on this date"
                                    >
                                      <CopySimple className="size-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEdit(slot)}
                                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                                      title="Edit"
                                    >
                                      <PencilSimple className="size-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPendingDelete(slot)}
                                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                                      title="Remove"
                                    >
                                      <Trash className="size-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* one dialog for both add and edit: an edit is the same slot with an id */}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setFormValues(emptySlot(examId));
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>
              {formValues.id ? "Edit sitting" : "Add sitting"}
            </DialogTitle>
            <DialogDescription>
              {data.exam.name} · pick the class, the paper and when it is sat.
            </DialogDescription>
          </DialogHeader>

          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(save)}>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {formValues.id ? (
                  <FormSelect
                    control={form.control}
                    name="classId"
                    label="Class"
                    options={data.classes.map((klass) => ({
                      label: klass.name,
                      value: klass.id,
                    }))}
                    disabled
                  />
                ) : (
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground">
                        Classes
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const all = data.classes.map((klass) => klass.id);
                          const next =
                            selectedClasses.length === all.length ? [] : all;
                          setSelectedClasses(next);
                          form.setValue("classId", next[0] ?? "");
                          form.setValue("subjectId", "");
                          form.setValue("sectionId", null);
                        }}
                        className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {selectedClasses.length === data.classes.length
                          ? "Clear"
                          : "Select all"}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {data.classes.map((klass) => {
                        const active = selectedClasses.includes(klass.id);
                        return (
                          <button
                            key={klass.id}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? selectedClasses.filter(
                                    (id) => id !== klass.id,
                                  )
                                : [...selectedClasses, klass.id];
                              setSelectedClasses(next);
                              form.setValue("classId", next[0] ?? "");
                              form.setValue("subjectId", "");
                              form.setValue("sectionId", null);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors",
                              active
                                ? "border-primary bg-primary/10 font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                            )}
                          >
                            {active && <Check className="size-3" />}
                            {klass.name}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      The subject below is added to every selected class on the
                      same date and time.
                    </p>
                  </div>
                )}

                <FormSelect
                  control={form.control}
                  name="kind"
                  label="Type"
                  options={[
                    { label: "Theory", value: "THEORY" },
                    { label: "Practical", value: "PRACTICAL" },
                  ]}
                />

                <div className="sm:col-span-2">
                  <FormSelect
                    control={form.control}
                    name="subjectId"
                    label="Subject"
                    placeholder={
                      selectedClasses.length > 0
                        ? "Choose a subject"
                        : "Pick the classes first"
                    }
                    disabled={selectedClasses.length === 0}
                    options={subjectsForClass}
                  />
                </div>

                <FormInput
                  control={form.control}
                  name="examDate"
                  label="Date"
                  type="date"
                />

                {(formValues.id || selectedClasses.length <= 1) && (
                  <FormSelect
                    control={form.control}
                    name="sectionId"
                    label="Section"
                    placeholder="Whole class"
                    disabled={selectedClasses.length === 0}
                    options={sectionsForClass}
                  />
                )}

                <FormInput
                  control={form.control}
                  name="startsAt"
                  label="Starts"
                  type="time"
                />

                <FormInput
                  control={form.control}
                  name="endsAt"
                  label="Ends"
                  type="time"
                />

                <div className="sm:col-span-2">
                  <FormInput
                    control={form.control}
                    name="note"
                    label="Note (optional)"
                    placeholder="e.g. Room 2, bring calculator"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />}
                  {formValues.id ? "Save changes" : "Add sitting"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <NoticeCard
        key={`${examId}:${data.notice}`}
        examId={examId}
        notice={data.notice}
      />

      {/* copy one sitting onto the other classes sitting that paper that day */}
      <Dialog
        open={copySource !== null}
        onOpenChange={(value) => {
          if (!value) setCopySource(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copy to other classes</DialogTitle>
            <DialogDescription>
              {copySource
                ? `${copySource.subjectName} · ${prettyDate(copySource.examDate)} · ${copySource.startsAt} – ${copySource.endsAt}`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-1">
            {data.classes
              .filter((klass) => klass.id !== copySource?.classId)
              .map((klass) => {
                const studies = data.subjects.some(
                  (subject) =>
                    subject.id === copySource?.subjectId &&
                    subject.classId === klass.id,
                );
                const checked = copyTargets.includes(klass.id);
                return (
                  <label
                    key={klass.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      studies
                        ? "cursor-pointer hover:bg-muted/50"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 accent-[var(--primary)]"
                      disabled={!studies}
                      checked={checked}
                      onChange={(event) =>
                        setCopyTargets((current) =>
                          event.target.checked
                            ? [...current, klass.id]
                            : current.filter((id) => id !== klass.id),
                        )
                      }
                    />
                    <span className="flex-1 text-foreground">{klass.name}</span>
                    {!studies && (
                      <span className="text-[11px] text-muted-foreground">
                        no such subject
                      </span>
                    )}
                  </label>
                );
              })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className="text-[11px] text-muted-foreground">
              Classes that already have this paper keep their own time.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCopySource(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={runCopy}
                disabled={copyTargets.length === 0}
              >
                <CopySimple />
                Copy ({copyTargets.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* copy every sitting of a date onto another date */}
      <Dialog
        open={copyDayFrom !== null}
        onOpenChange={(value) => {
          if (!value) {
            setCopyDayFrom(null);
            setCopyDayTo("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Copy the whole day</DialogTitle>
            <DialogDescription>
              {copyDayFrom
                ? `Every sitting on ${prettyDate(copyDayFrom)} is copied to the date you pick.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="py-1">
            <label className="mb-1 block text-xs font-medium text-foreground">
              Copy to
            </label>
            <input
              type="date"
              value={copyDayTo}
              onChange={(event) => setCopyDayTo(event.target.value)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCopyDayFrom(null)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={runCopyDay} disabled={!copyDayTo}>
              <CalendarPlus />
              Copy day
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(value) => {
          if (!value) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove this sitting?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `${pendingDelete.subjectName} · ${prettyDate(
                    pendingDelete.examDate,
                  )} — the rest of the routine is untouched.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={remove}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
