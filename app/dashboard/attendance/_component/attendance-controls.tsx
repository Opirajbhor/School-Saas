"use client";

import { useRouter } from "next/navigation";
import { Rows, SquaresFour, UserSquare } from "@phosphor-icons/react/ssr";

import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/src/lib/utils";

export type AttendanceLayout = "all" | "2" | "1";

const LAYOUTS: {
  value: AttendanceLayout;
  label: string;
  hint: string;
  icon: typeof Rows;
}[] = [
  {
    value: "all",
    label: "One register",
    hint: "Every student on one sheet, a column per paper",
    icon: Rows,
  },
  {
    value: "2",
    label: "Two per page",
    hint: "Two students to an A4 page, signature against each paper",
    icon: SquaresFour,
  },
  {
    value: "1",
    label: "One per page",
    hint: "A full page per student, with room to write",
    icon: UserSquare,
  },
];

/** Exam / class / section pickers plus the sheet layout. They drive the URL. */
export function AttendanceControls({
  exams,
  classes,
  sections,
  examId,
  classId,
  sectionId,
  layout,
}: {
  exams: { label: string; value: string }[];
  classes: { label: string; value: string }[];
  sections: { label: string; value: string; classId: string }[];
  examId?: string;
  classId?: string;
  sectionId?: string;
  layout: AttendanceLayout;
}) {
  const router = useRouter();

  const go = (next: {
    exam?: string | null;
    class?: string | null;
    section?: string | null;
    layout?: AttendanceLayout;
  }) => {
    const params = new URLSearchParams();
    const exam = next.exam === undefined ? examId : next.exam;
    const klass = next.class === undefined ? classId : next.class;
    const section = next.section === undefined ? sectionId : next.section;
    const nextLayout = next.layout ?? layout;

    if (exam) params.set("exam", exam);
    if (klass) params.set("class", klass);
    if (section) params.set("section", section);
    params.set("layout", nextLayout);

    router.push(`/dashboard/attendance?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <Card className="grid gap-3 p-3 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Exam</p>
          <Combobox
            options={exams}
            value={examId ?? null}
            onValueChange={(value) => go({ exam: value, section: null })}
            placeholder="Choose an exam"
            searchPlaceholder="Search exams…"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Class</p>
          <Combobox
            options={classes}
            value={classId ?? null}
            onValueChange={(value) => go({ class: value, section: null })}
            placeholder="Choose a class"
            searchPlaceholder="Search classes…"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Section</p>
          <Combobox
            options={sections
              .filter((section) => !classId || section.classId === classId)
              .map(({ label, value }) => ({ label, value }))}
            value={sectionId ?? null}
            onValueChange={(value) => go({ section: value })}
            placeholder="All sections"
            clearLabel="All sections"
            searchPlaceholder="Search sections…"
            disabled={!classId}
          />
        </div>
      </Card>

      <Card className="p-3">
        <p className="mb-2 text-xs font-medium text-foreground">Sheet layout</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {LAYOUTS.map((option) => {
            const active = option.value === layout;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => go({ layout: option.value })}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/60",
                )}
              >
                <option.icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="block text-[11px] leading-snug text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
