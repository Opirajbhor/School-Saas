import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/utils/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  MarkEntryStatus,
  MarkEditRequestStatus,
  MarkWorkflow,
  MonitoringCompletionStatus,
} from "../../_schema/exam.zod";

// --- Link to a subject's student-level monitoring view ---
export function OpenSubjectLink({
  examId,
  classId,
  sectionId,
  subjectId,
}: {
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
}) {
  return (
    <Button variant="outline" size="xs" asChild>
      <Link
        href={`/dashboard/exam/${examId}/monitoring?classId=${classId}&sectionId=${sectionId}&subjectId=${subjectId}`}
      >
        View
        <ArrowRight data-icon="inline-end" />
      </Link>
    </Button>
  );
}

// --- Progress bar with the percentage beside it ---
export function ProgressBar({
  value,
  className,
  muted,
}: {
  value: number;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={muted ? 0 : value}
        className={cn("h-1.5 flex-1", muted && "opacity-40")}
      />
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
        {muted ? "—" : `${value}%`}
      </span>
    </div>
  );
}

// --- Not Started / In Progress / Completed ---
export function CompletionBadge({
  status,
}: {
  status: MonitoringCompletionStatus;
}) {
  const labels: Record<MonitoringCompletionStatus, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
  };
  const variants: Record<
    MonitoringCompletionStatus,
    "default" | "secondary" | "outline"
  > = {
    NOT_STARTED: "outline",
    IN_PROGRESS: "default",
    COMPLETED: "secondary",
  };

  return (
    <Badge
      variant={variants[status]}
      className="h-auto px-2 py-0.5 text-[11px] font-semibold"
    >
      {labels[status]}
    </Badge>
  );
}

// --- Draft / Submitted ---
export function EntryStatusBadge({ status }: { status: MarkEntryStatus }) {
  return (
    <Badge
      variant={status === "SUBMITTED" ? "secondary" : "outline"}
      className="h-auto px-2 py-0.5 text-[11px] font-semibold"
    >
      {status === "SUBMITTED" ? "Submitted" : "Draft"}
    </Badge>
  );
}

// --- Edit request state ---
export function EditRequestBadge({
  status,
}: {
  status: MarkEditRequestStatus;
}) {
  const labels: Record<MarkEditRequestStatus, string> = {
    PENDING: "Edit requested",
    APPROVED: "Edit approved",
    REJECTED: "Edit rejected",
  };
  const variants: Record<
    MarkEditRequestStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PENDING: "outline",
    APPROVED: "secondary",
    REJECTED: "destructive",
  };

  return (
    <Badge
      variant={variants[status]}
      className="h-auto px-2 py-0.5 text-[11px] font-semibold"
    >
      {labels[status]}
    </Badge>
  );
}

// --- Open / Finalized / Published ---
export function MarkWorkflowBadge({ workflow }: { workflow: MarkWorkflow }) {
  const labels: Record<MarkWorkflow, string> = {
    OPEN: "Marks Open",
    FINALIZED: "Finalized",
    PUBLISHED: "Published",
  };
  const variants: Record<MarkWorkflow, "default" | "secondary" | "outline"> = {
    OPEN: "outline",
    FINALIZED: "default",
    PUBLISHED: "secondary",
  };

  return (
    <Badge
      variant={variants[workflow]}
      className="h-auto px-2.5 py-0.5 text-[11px] font-semibold"
    >
      {labels[workflow]}
    </Badge>
  );
}
