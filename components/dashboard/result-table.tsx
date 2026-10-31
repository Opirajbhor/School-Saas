import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, Clock } from "lucide-react";
import type { ExamProgress } from "@/app/dashboard/_lib/attention";

// Lifecycle vocabulary shared with the exam feature. The badge colour is the
// only place colour is used on this table — progress is carried by the bar.
const workflowStyle = {
  PUBLISHED:
    "border-chart-3/20 bg-chart-3/10 text-chart-3 [&>span]:bg-chart-3",
  FINALIZED: "border-chart-4/25 bg-chart-4/15 text-chart-4 [&>span]:bg-chart-4",
  OPEN: "border-primary/20 bg-primary/10 text-primary [&>span]:bg-primary",
} as const;

/** Progress bar for one exam: units completed out of units required. */
function ProgressBar({ completion }: { completion: number }) {
  const tone =
    completion >= 100
      ? "bg-primary"
      : completion === 0
        ? "bg-muted-foreground/40"
        : "bg-chart-4";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${Math.min(completion, 100)}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {completion}%
      </span>
    </div>
  );
}

/**
 * Exam progress per exam rather than a registry: an admin opening the
 * dashboard needs to know what is finished, what is stuck and what is
 * published — not how many papers exist.
 */
export function ResultsTable({ rows }: { rows: ExamProgress[] }) {
  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden lg:h-[26rem]">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <div>
          <h2 className="font-heading font-semibold text-foreground">
            Exam progress
          </h2>
          <p className="text-sm text-muted-foreground">
            Mark entry across every class and section
          </p>
        </div>
        <Link
          href="/dashboard/exam"
          className="ml-auto text-xs font-medium text-foreground hover:underline"
        >
          All exams
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-sm text-muted-foreground">
            No exams yet. Your platform admin creates them, so one will appear
            here once it exists.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">Exam</th>
                  <th className="px-2 py-2.5 text-right font-semibold">
                    Classes
                  </th>
                  <th className="px-2 py-2.5 font-semibold">Entry</th>
                  <th className="px-2 py-2.5 font-semibold">Papers</th>
                  <th className="px-2 py-2.5 font-semibold">Status</th>
                  <th className="px-2 py-2.5 text-right font-semibold">
                    Requests
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {rows.map((exam) => (
                  <tr
                    key={exam.examId}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/exam/${exam.examId}`}
                        className="font-semibold text-foreground hover:underline"
                      >
                        {exam.examName}
                      </Link>
                      <div className="font-mono text-xs text-muted-foreground">
                        {exam.sessionName ?? "No session"}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-sm tabular-nums text-muted-foreground">
                      {exam.assignedClasses}
                    </td>
                    <td className="px-2 py-3">
                      <ProgressBar completion={exam.completion} />
                    </td>
                    <td className="px-2 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                      {exam.completedUnits}/{exam.units}
                    </td>
                    <td className="px-2 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-6 gap-1.5 rounded-md px-2 font-mono text-[11px] font-semibold",
                          workflowStyle[
                            exam.workflow as keyof typeof workflowStyle
                          ],
                        )}
                      >
                        <span className="size-1.5 rounded-full" />
                        {exam.workflow}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-right">
                      {exam.pendingRequests > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-chart-4">
                          <Clock className="size-3" />
                          {exam.pendingRequests}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={
                          exam.status === "COMPLETED" &&
                          exam.workflow === "OPEN"
                            ? `/dashboard/exam/${exam.examId}`
                            : "/dashboard/exam/mark-input"
                        }
                        title={
                          exam.status === "COMPLETED" &&
                          exam.workflow === "OPEN"
                            ? "Review and publish"
                            : "Continue mark entry"
                        }
                        className="inline-flex rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {exam.status === "COMPLETED" &&
                        exam.workflow === "OPEN" ? (
                          <ClipboardCheck className="size-4.5" />
                        ) : (
                          <ArrowUpRight className="size-4.5" />
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              Showing {rows.length} exam{rows.length === 1 ? "" : "s"}
            </span>
            <Link
              href="/dashboard/results"
              className="font-semibold text-foreground hover:underline"
            >
              Published results
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
