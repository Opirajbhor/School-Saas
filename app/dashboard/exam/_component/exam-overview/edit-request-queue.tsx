"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMarkEditRequests,
  resolveMarkEditRequest,
} from "../../_actions/markEditRequest.action";
import { EditRequestBadge } from "./monitoring-ui";

// Admin queue for teacher edit requests. Approving unlocks only the unit the
// request points at.
export default function EditRequestQueue({ examId }: { examId?: string }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isPending, isError } = useQuery({
    queryKey: ["examMonitoring", "edit-requests", examId ?? "all"],
    queryFn: async () => {
      const result = await getMarkEditRequests(examId);
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
  });

  const resolve = async (
    requestId: string,
    decision: "APPROVED" | "REJECTED",
  ) => {
    setBusyId(requestId);
    const result = await resolveMarkEditRequest({
      requestId,
      decision,
      resolutionNote: notes[requestId]?.trim() || undefined,
    });
    setBusyId(null);

    if (!result.success) {
      toast.error(String(result.error));
      return;
    }

    toast.success(
      decision === "APPROVED" ? "Edit request approved" : "Edit request rejected",
    );
    queryClient.invalidateQueries({ queryKey: ["examMonitoring"] });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Spinner />
        Loading requests...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load edit requests</AlertTitle>
        <AlertDescription>Try again in a moment.</AlertDescription>
      </Alert>
    );
  }

  const pending = data.filter((request) => request.status === "PENDING");
  const resolved = data.filter((request) => request.status !== "PENDING");

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border">
        <CardTitle>Edit Requests</CardTitle>
        <CardDescription>
          Teachers must ask before changing submitted marks. Approving re-opens
          only that section and subject.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {data.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No edit requests yet.
          </p>
        )}

        {pending.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead className="min-w-56">Reason</TableHead>
                  <TableHead className="min-w-48">Note (optional)</TableHead>
                  <TableHead className="w-40 text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-foreground">
                      {request.requestedBy?.nameEnglish ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {request.class.name} · {request.section.name}
                      <span className="block text-xs">
                        {request.subject.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{request.reason}</TableCell>
                    <TableCell>
                      <Input
                        value={notes[request.id] ?? ""}
                        onChange={(event) =>
                          setNotes((prev) => ({
                            ...prev,
                            [request.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a note..."
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === request.id}
                          onClick={() => resolve(request.id, "APPROVED")}
                        >
                          {busyId === request.id ? <Spinner /> : <Check />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === request.id}
                          onClick={() => resolve(request.id, "REJECTED")}
                        >
                          <X />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {resolved.length > 0 && (
          <div className="border-t border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock size={12} />
              Resolved
            </p>
            <div className="space-y-2">
              {resolved.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span className="text-muted-foreground">
                    {request.class.name} · {request.section.name} ·{" "}
                    {request.subject.name}
                    {request.resolvedBy
                      ? ` — by ${request.resolvedBy.nameEnglish}`
                      : ""}
                  </span>
                  <EditRequestBadge status={request.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
