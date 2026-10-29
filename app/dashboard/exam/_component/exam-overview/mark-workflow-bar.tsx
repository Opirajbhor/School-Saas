"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LockOpen, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  getExamMarkWorkflow,
  setExamMarkWorkflow,
} from "../../_actions/markEditRequest.action";
import { MarkWorkflow } from "../../_schema/exam.zod";
import { MarkWorkflowBadge } from "./monitoring-ui";

// Admin control for the exam-level mark lock. Once finalized nobody — admin or
// teacher, approved request or not — may change a mark until it is reopened.
// Publishing is one-way.
export default function MarkWorkflowBar({ examId }: { examId: string }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ["examMonitoring", "workflow", examId],
    queryFn: async () => {
      const result = await getExamMarkWorkflow(examId);
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
  });

  const change = async (workflow: MarkWorkflow) => {
    setBusy(true);
    const result = await setExamMarkWorkflow({ examId, workflow });
    setBusy(false);

    if (!result.success) {
      toast.error(String(result.error));
      return;
    }

    toast.success(
      workflow === "OPEN"
        ? "Marks reopened for editing"
        : workflow === "FINALIZED"
          ? "Marks finalized and locked"
          : "Results published and locked",
    );
    queryClient.invalidateQueries({ queryKey: ["examMonitoring"] });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Spinner />
        Loading mark status...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load the mark lock</AlertTitle>
        <AlertDescription>Try again in a moment.</AlertDescription>
      </Alert>
    );
  }

  const { workflow, incompleteUnits } = data;
  const locked = workflow !== "OPEN";

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {locked ? <Lock size={16} /> : <LockOpen size={16} />}
              Marks &amp; Publication
              <MarkWorkflowBadge workflow={workflow} />
            </CardTitle>
            <CardDescription>
              {workflow === "OPEN"
                ? "Teachers can still enter and submit marks, and admins can correct them."
                : workflow === "FINALIZED"
                  ? "Marks are locked for everyone. Reopen to allow corrections again."
                  : "Results are published. Marks are locked permanently."}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {workflow === "OPEN" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => change("FINALIZED")}
                >
                  {busy ? <Spinner /> : <Lock />}
                  Finalize Marks
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => change("PUBLISHED")}
                >
                  {busy ? <Spinner /> : <Send />}
                  Publish Results
                </Button>
              </>
            )}

            {workflow === "FINALIZED" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => change("OPEN")}
                >
                  {busy ? <Spinner /> : <LockOpen />}
                  Reopen Marks
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => change("PUBLISHED")}
                >
                  {busy ? <Spinner /> : <Send />}
                  Publish Results
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {(workflow === "OPEN" || workflow === "FINALIZED") &&
        incompleteUnits > 0 && (
          <CardContent className="pt-4">
            <Alert>
              <TriangleAlert />
              <AlertTitle>
                {incompleteUnits} unit{incompleteUnits === 1 ? "" : "s"} not yet
                submitted
              </AlertTitle>
              <AlertDescription>
                {workflow === "OPEN"
                  ? "These sections and subjects have no submitted marks. Finalizing now locks in the current state."
                  : "These units were locked without submitted marks. Reopen first if they still need entering."}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
    </Card>
  );
}
