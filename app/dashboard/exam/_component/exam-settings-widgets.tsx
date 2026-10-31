import { GraduationCap, Tags } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  OutputExamGradeRangeType,
  OutputExamMarkTypes,
} from "../_schema/exam.zod";

/**
 * The mark types and grade scale used to be two big navigation cards at the
 * bottom of the exams page. They are reference data you glance at while
 * looking at exams, so they show up as widgets at the top instead.
 */
export function ExamSettingsWidgets({
  markTypes,
  grades,
}: {
  markTypes: OutputExamMarkTypes[];
  grades: OutputExamGradeRangeType[];
}) {
  const activeTypes = markTypes.filter((type) => type.status === "ACTIVE");

  // highest band first, so A+ sits at the top of the scale
  const orderedGrades = [...grades].sort(
    (a, b) => Number(b.maxMark) - Number(a.maxMark),
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Tags className="size-4 text-muted-foreground/60" />
          <h2 className="text-sm font-semibold text-foreground">Mark types</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {markTypes.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-4">
          {markTypes.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No mark types yet — add the components each paper is marked on
              (written, MCQ, practical).
            </p>
          )}

          {markTypes.map((type) => (
            <span
              key={type.id}
              className={
                type.status === "ACTIVE"
                  ? "rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground"
                  : "rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground line-through"
              }
            >
              {type.name}
            </span>
          ))}
        </div>

        <p className="mt-auto border-t px-4 py-2 text-[11px] text-muted-foreground">
          {activeTypes.length} active · used for every exam paper
        </p>
      </Card>

      <Card className="gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <GraduationCap className="size-4 text-muted-foreground/60" />
          <h2 className="text-sm font-semibold text-foreground">Grade scale</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {grades.length}
          </span>
        </div>

        {/* one compact chip per band — the whole scale fits in two lines */}
        <div className="flex flex-wrap gap-1 p-3">
          {orderedGrades.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No grade ranges yet — GPA cannot be calculated without them.
            </p>
          ) : (
            orderedGrades.map((grade) => (
              <span
                key={grade.id}
                className="flex items-baseline gap-1 rounded border bg-muted/30 px-1.5 py-1"
              >
                <span className="text-[11px] font-semibold leading-none text-foreground">
                  {grade.name}
                </span>
                <span className="text-[10px] leading-none tabular-nums text-muted-foreground">
                  {grade.minMark}–{grade.maxMark}
                </span>
                <span className="text-[10px] font-medium leading-none tabular-nums text-foreground/60">
                  {Number(grade.GPA).toFixed(2)}
                </span>
              </span>
            ))
          )}
        </div>

        <p className="mt-auto border-t px-4 py-2 text-[11px] text-muted-foreground">
          Marks are converted to GPA with this scale
        </p>
      </Card>
    </div>
  );
}
