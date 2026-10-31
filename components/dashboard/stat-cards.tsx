import { Metric, metricValue } from "@/components/dashboard/metric";
import { BookOpen, GraduationCap, LayoutGrid, Users } from "lucide-react";
import type { DashboardCounts } from "@/app/dashboard/_actions/dashboard.action";
import type { SectionCoverage } from "@/app/dashboard/_lib/attention";

type StatCardsProps = {
  counts?: DashboardCounts;
  coverage?: SectionCoverage;
  /** completed units over all units, across every exam in the institute */
  marks?: { units: number; completedUnits: number; completion: number } | null;
};

export function StatCards({ counts, coverage, marks }: StatCardsProps) {
  const uncovered = coverage?.withoutClassTeacher ?? 0;
  const units = marks?.units ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Students"
        value={metricValue(counts?.students)}
        icon={Users}
        segments={
          counts && counts.students > 0
            ? [
                { value: counts.maleStudents, className: "bg-foreground" },
                {
                  value: counts.femaleStudents,
                  className: "bg-foreground/30",
                },
              ]
            : undefined
        }
        footer={
          <p className="text-xs text-muted-foreground">
            {counts && counts.students > 0
              ? `${counts.maleStudents} boys · ${counts.femaleStudents} girls`
              : "No students enrolled yet"}
          </p>
        }
      />

      <Metric
        label="Teachers"
        value={metricValue(counts?.teachers)}
        icon={GraduationCap}
        segments={
          coverage && coverage.sections > 0
            ? [
                {
                  value: coverage.withClassTeacher,
                  className: "bg-foreground",
                },
                {
                  value: coverage.withoutClassTeacher,
                  className: "bg-destructive/50",
                },
              ]
            : undefined
        }
        footer={
          <p className="text-xs text-muted-foreground">
            {coverage
              ? uncovered === 0
                ? "Every section has a class teacher"
                : `${uncovered} of ${coverage.sections} sections uncovered`
              : "Coverage unavailable"}
          </p>
        }
      />

      <Metric
        label="Classes"
        value={metricValue(counts?.classes)}
        icon={LayoutGrid}
        footer={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-medium tabular-nums text-foreground">
                {metricValue(counts?.sections)}
              </span>{" "}
              sections
            </span>
            <span>
              <span className="font-medium tabular-nums text-foreground">
                {metricValue(counts?.subjects)}
              </span>{" "}
              subjects
            </span>
          </div>
        }
      />

      <Metric
        label="Papers entered"
        value={units > 0 ? `${marks?.completion ?? 0}%` : "—"}
        icon={BookOpen}
        segments={
          units > 0
            ? [
                {
                  value: marks?.completedUnits ?? 0,
                  className: "bg-foreground",
                },
              ]
            : undefined
        }
        footer={
          <p className="text-xs text-muted-foreground">
            {units > 0
              ? `${marks?.completedUnits} of ${units} exam papers`
              : "No papers configured yet"}
          </p>
        }
      />
    </div>
  );
}

// Real counts for one institute, passed in so the caller owns the query.
export type StudentStats = {
  total: number;
  active: number;
  inactive: number;
  classes: number;
  sections: number;
};
