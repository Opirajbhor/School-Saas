import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// Shown above the result table and collapsed into one line when complete.
export function IncompleteMarksPanel({
  incomplete,
  sections,
}: {
  incomplete: OutputExamResultType["incomplete"];
  sections: OutputExamResultType["sections"];
}) {
  if (incomplete.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
        All marks are entered. Positions below are final for this exam.
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

  return (
    <Card className="gap-0 border-destructive/40 py-0">
      <CardHeader className="border-b border-destructive/30 bg-destructive/5">
        <CardTitle className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          Incomplete marks
          <span className="font-normal text-muted-foreground">
            {totalMissing} {totalMissing === 1 ? "mark" : "marks"} missing
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border py-0">
        {[...bySubject.values()].map((units) => {
          const subject = units[0];
          const anySubmitted = units.some((unit) => unit.submitted);
          return (
            <div
              key={subject.subjectId}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {subject.subjectName}
                </span>
                {anySubmitted && (
                  <Badge
                    variant="outline"
                    className="h-auto px-1.5 py-0 text-[11px]"
                  >
                    partly submitted
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {units.map((unit) => unit.sectionName).join(", ")}
                </span>
                <Badge
                  variant="destructive"
                  className="h-auto px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                >
                  {units.reduce((sum, unit) => sum + unit.missing, 0)} missing
                </Badge>
              </div>
            </div>
          );
        })}
        <p className="py-2.5 text-xs text-muted-foreground">
          Sections with incomplete marks:{" "}
          {sections
            .filter((section) =>
              incomplete.some((unit) => unit.sectionId === section.id),
            )
            .map((section) => section.name)
            .join(", ")}
        </p>
      </CardContent>
    </Card>
  );
}
