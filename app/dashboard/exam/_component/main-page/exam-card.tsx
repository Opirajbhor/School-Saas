import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Calendar, ClipboardList, Layers } from "lucide-react";
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

  return (
    <Card className="transition-shadow hover:shadow-md">
      {/* Top Row: Icon, Title, Status */}
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg">
            <ClipboardList size={20} />
          </div>
          <CardTitle className="leading-tight">{exam.name}</CardTitle>
        </div>
        <CardAction>
          <StatusBadge status={summary?.status} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Session */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calendar size={14} className="text-muted-foreground" />
          <span>
            {summary?.sessionName
              ? `Session ${summary.sessionName}`
              : "No session set"}
          </span>
        </div>

        {/* Assigned Classes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Assigned Classes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {exam.assignClasses.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No classes assigned
              </span>
            )}
            {exam.assignClasses.map((cls) => (
              <Badge key={cls.class.id} variant="secondary">
                {cls.class.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Mark Entry Progress
          </p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <Progress value={completion} className="h-2" />
              <p className="text-[11px] font-medium text-muted-foreground">
                {completion}% complete
                {summary ? ` · ${summary.completedUnits}/${summary.units} units` : ""}
              </p>
            </div>

            {/* Action Button */}
            <Button variant="outline" size="icon-sm" className="rounded-full">
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {/* Pending requests */}
        {summary && summary.pendingRequests > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Layers size={12} />
            {summary.pendingRequests} pending edit request
            {summary.pendingRequests === 1 ? "" : "s"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- Reusable Status Badge ---
function StatusBadge({ status }: { status?: string }) {
  const labels: Record<string, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  };
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    NOT_STARTED: "outline",
    IN_PROGRESS: "default",
    COMPLETED: "secondary",
  };
  const key = status ?? "NOT_STARTED";

  return (
    <Badge
      variant={variants[key] ?? "secondary"}
      className="h-auto px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
    >
      {labels[key] ?? key}
    </Badge>
  );
}
