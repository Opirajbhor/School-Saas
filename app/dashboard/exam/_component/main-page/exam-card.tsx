import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Calendar, ClipboardList } from "lucide-react";
import {
  ExamMonitoringSummaryType,
  OutputExamType,
} from "../../_schema/exam.zod";

// --- Reusable Exam Card Component ---
// shows the real monitoring progress; `summary` comes from the server
export function ExamCard({
  exam,
  summary,
}: {
  exam: OutputExamType;
  summary?: ExamMonitoringSummaryType;
}) {
  const completion = summary?.completion ?? 0;
  const pending = summary?.pendingRequests ?? 0;

  return (
    <Card className="gap-0 p-0 transition-shadow hover:shadow-md">
      {/* identity row */}
      <div className="flex items-start gap-2.5 px-3.5 pt-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/30">
          <ClipboardList size={15} className="text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight text-foreground">
            {exam.name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar size={11} />
            {summary?.sessionName
              ? `Session ${summary.sessionName}`
              : "No session set"}
          </p>
        </div>

        <StatusBadge status={summary?.status} />
      </div>

      {/* assigned classes */}
      <div className="mt-2.5 flex flex-wrap gap-1 px-3.5">
        {exam.assignClasses.length === 0 && (
          <span className="text-[11px] text-muted-foreground">
            No classes assigned
          </span>
        )}
        {exam.assignClasses.map((cls) => (
          <span
            key={cls.class.id}
            className="rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {cls.class.name}
          </span>
        ))}
      </div>

      {/* progress */}
      <div className="mt-2.5 space-y-1 px-3.5">
        <Progress value={completion} className="h-1.5" />
        <div className="flex items-center justify-between gap-3 text-[10px] tabular-nums text-muted-foreground">
          <span>
            {completion}% complete
            {summary ? ` · ${summary.completedUnits}/${summary.units} papers` : ""}
          </span>
          {pending > 0 && (
            <span>
              {pending} pending request{pending === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="mt-2.5 flex items-center justify-between border-t px-3.5 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Mark entry
        </span>
        <ArrowRight size={13} className="text-muted-foreground" />
      </div>
    </Card>
  );
}

// --- Reusable Status Badge ---
function StatusBadge({ status }: { status?: string }) {
  const labels: Record<string, string> = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
  };
  const styles: Record<string, string> = {
    NOT_STARTED: "border text-muted-foreground",
    IN_PROGRESS: "border border-primary/30 bg-primary/10 text-primary",
    COMPLETED: "border border-chart-3/30 bg-chart-3/10 text-chart-3",
  };
  const key = status ?? "NOT_STARTED";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        styles[key] ?? styles.NOT_STARTED
      }`}
    >
      {labels[key] ?? key}
    </span>
  );
}
