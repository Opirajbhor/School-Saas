"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Send, TriangleAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { setExamMarkWorkflow } from "../../_actions/markEditRequest.action";
import { getPublishReadiness } from "../../_actions/result.action";
import { MarkWorkflow } from "../../_schema/exam.zod";
import { MarkWorkflowBadge } from "../exam-overview/monitoring-ui";

// Admin review + publication control for one exam + class. Publishing freezes
// the sheet into a snapshot, so what is published stays put even if a mark is
// corrected later. Unpublishing takes the results back down but keeps that
// snapshot as history.
export default function ResultReview({
  examId,
  classId,
  workflow,
  fromSnapshot,
  snapshotVersion,
}: {
  examId: string;
  classId: string;
  workflow: MarkWorkflow;
  fromSnapshot: boolean;
  snapshotVersion?: number;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["examResult", "readiness", examId, classId],
    queryFn: async () => {
      const result = await getPublishReadiness({ examId, classId });
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
  });

  const change = async (target: MarkWorkflow, successMessage: string) => {
    setBusy(true);
    const result = await setExamMarkWorkflow({ examId, workflow: target });
    setBusy(false);

    if (!result.success) {
      toast.error(String(result.error));
      return;
    }

    toast.success(successMessage);
    setConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ["examResult"] });
    queryClient.invalidateQueries({ queryKey: ["examMonitoring"] });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner />
        Checking the results before publishing...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not review the results</AlertTitle>
        <AlertDescription>Try again in a moment.</AlertDescription>
      </Alert>
    );
  }

  const { ready, incomplete, problems } = data;
  const missingMarks = incomplete.reduce((sum, unit) => sum + unit.missing, 0);
  const published = workflow === "PUBLISHED";

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2">
              Result Review
              <MarkWorkflowBadge workflow={workflow} />
              {fromSnapshot && (
                <Badge variant="outline" className="h-auto px-1.5 py-0 text-[11px]">
                  frozen · v{snapshotVersion}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {published
                ? "These results are published and frozen. Unpublish to correct marks; the published snapshot is kept."
                : "Check the sheet, then publish. Publishing locks the marks and saves a frozen copy."}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {published ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  change("FINALIZED", "Results unpublished and marks unlockable")
                }
              >
                {busy ? <Spinner /> : <Undo2 />}
                Unpublish Results
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                <Send />
                Publish Results
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {ready ? (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Ready to publish</AlertTitle>
            <AlertDescription>
              Every section and subject has marks, and no student looks wrong.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>
              {missingMarks > 0
                ? `${missingMarks} mark${missingMarks === 1 ? "" : "s"} missing`
                : `${problems.length} result${problems.length === 1 ? "" : "s"} need a check`}
            </AlertTitle>
            <AlertDescription>
              <span className="block">
                You can still publish — this only warns, it does not block.
              </span>
              {incomplete.length > 0 && (
                <span className="mt-2 block">
                  Missing in{" "}
                  {incomplete
                    .map((unit) => `${unit.subjectName} (${unit.sectionName})`)
                    .join(", ")}
                  .
                </span>
              )}
              {problems.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-4">
                  {problems.slice(0, 5).map((problem) => (
                    <li key={`${problem.kind}-${problem.studentId}`}>
                      Roll {problem.roll} · {problem.studentName} —{" "}
                      {problem.detail}
                    </li>
                  ))}
                  {problems.length > 5 && (
                    <li>and {problems.length - 5} more</li>
                  )}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Publishing is the point of no return for the marks, so it is confirmed
          explicitly rather than fired straight from the button. */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish these results?</DialogTitle>
            <DialogDescription>
              The sheet is frozen as a snapshot and the exam's marks are locked.
              {!ready && " Results are incomplete — publishing will record them as they stand."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={busy}
              onClick={() =>
                change("PUBLISHED", "Results published and frozen")
              }
            >
              {busy ? <Spinner /> : <Send />}
              {busy ? "Publishing..." : "Publish Results"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
