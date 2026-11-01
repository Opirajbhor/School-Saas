import { CheckCircle as Checkmark, Warning as AlertTriangle } from "@phosphor-icons/react/ssr";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OutputExamResultType } from "../../_schema/exam.zod";

// --- A+ / A / F badge, red when the subject or the student failed ---
export function ResultGradeBadge({
  grade,
  failed,
  absent,
}: {
  grade: string;
  failed: boolean;
  absent: boolean;
}) {
  return (
    <Badge
      variant={failed ? "destructive" : "secondary"}
      className="h-auto px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
    >
      {absent && grade === "F" ? "AB" : grade}
    </Badge>
  );
}

// --- The list of sections × subjects still missing marks ---
// One dense line per subject so it reads at a glance without pushing the table
// down the page. Collapses to one line when nothing is missing.
export function IncompleteMarksPanel({
  incomplete,
  sections,
}: {
  incomplete: OutputExamResultType["incomplete"];
  sections: OutputExamResultType["sections"];
}) {
  if (incomplete.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs text-foreground">
        <Checkmark className="size-3.5 text-emerald-600 dark:text-emerald-500" />
        All marks are entered — positions below are final.
      </div>
    );
  }

  // group the units by subject, with the affected sections listed once
  const bySubject = new Map<string, OutputExamResultType["incomplete"]>();
  for (const unit of incomplete) {
    if (!bySubject.has(unit.subjectId)) bySubject.set(unit.subjectId, []);
    bySubject.get(unit.subjectId)!.push(unit);
  }

  const totalMissing = incomplete.reduce((sum, unit) => sum + unit.missing, 0);
  const partly = incomplete.filter((unit) => unit.submitted).length;

  return (
    <Card className="gap-0 overflow-hidden border-amber-500/40 py-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-amber-500/30 bg-amber-500/5 px-3 py-1.5">
        <AlertTriangle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
        <span className="text-xs font-semibold text-foreground">
          Incomplete marks
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {totalMissing} {totalMissing === 1 ? "cell" : "cells"} ·{" "}
          {bySubject.size} {bySubject.size === 1 ? "subject" : "subjects"}
          {partly > 0 ? ` · ${partly} partly submitted` : ""}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          missing cells count as 0
        </span>
      </div>

      <ul className="divide-y divide-border/60">
        {[...bySubject.values()].map((units) => {
          const subject = units[0];
          const subjectMissing = units.reduce(
            (sum, unit) => sum + unit.missing,
            0,
          );

          return (
            <li
              key={subject.subjectId}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 text-xs"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {subject.subjectName}
              </span>

              <span className="flex flex-wrap items-center gap-1">
                {units.map((unit) => {
                  const entered = Math.max(unit.students - unit.missing, 0);
                  const percent = unit.students
                    ? Math.round((entered / unit.students) * 100)
                    : 0;

                  return (
                    <span
                      key={`${unit.sectionId}-${unit.subjectId}`}
                      className="flex items-center gap-1 rounded border bg-muted/40 px-1 py-0.5 text-[10px] tabular-nums text-muted-foreground"
                      title={`Section ${unit.sectionName} — ${entered} of ${unit.students} entered`}
                    >
                      {unit.sectionName}
                      <span className="h-1 w-6 overflow-hidden rounded-full bg-border">
                        <span
                          className={
                            percent === 0
                              ? "block h-full bg-destructive/70"
                              : "block h-full bg-amber-500"
                          }
                          style={{ width: `${Math.max(percent, 6)}%` }}
                        />
                      </span>
                      {entered}/{unit.students}
                    </span>
                  );
                })}
              </span>

              <span className="shrink-0 rounded border border-destructive/30 bg-destructive/10 px-1 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
                {subjectMissing} missing
              </span>
            </li>
          );
        })}
      </ul>

      <p className="border-t bg-muted/30 px-3 py-1 text-[10px] text-muted-foreground">
        Sections affected:{" "}
        {sections
          .filter((section) =>
            incomplete.some((unit) => unit.sectionId === section.id),
          )
          .map((section) => section.name)
          .join(", ") || "—"}
        . Totals and positions move once the marks are entered.
      </p>
    </Card>
  );
}
