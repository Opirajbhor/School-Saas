"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMarkCorrections } from "../../_actions/markEditRequest.action";

// Who changed a mark, from what to what, and under whose approval. Collapsed by
// default because it is an audit view, not part of the entry workflow.
export default function CorrectionHistory({
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
  const [open, setOpen] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: [
      "examMonitoring",
      "corrections",
      examId,
      classId,
      sectionId,
      subjectId,
    ],
    queryFn: async () => {
      const result = await getMarkCorrections({
        examId,
        classId,
        sectionId,
        subjectId,
      });
      if (!result.success) throw new Error(String(result.error));
      return result.data;
    },
    enabled: open,
  });

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <History size={16} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Correction History
            </p>
            <p className="text-xs text-muted-foreground">
              Every change made to a mark after it was first saved.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
        >
          <ChevronDown
            size={14}
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          />
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border">
          {isPending && (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Spinner />
              Loading history...
            </div>
          )}

          {isError && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertTitle>Could not load correction history</AlertTitle>
                <AlertDescription>Try again in a moment.</AlertDescription>
              </Alert>
            </div>
          )}

          {data && data.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No changes have been made to these marks yet.
            </p>
          )}

          {data && data.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">When</TableHead>
                    <TableHead className="px-4">Student</TableHead>
                    <TableHead className="px-4">Mark Type</TableHead>
                    <TableHead className="px-4 text-center">Old</TableHead>
                    <TableHead className="px-4 text-center">New</TableHead>
                    <TableHead className="px-4">Changed By</TableHead>
                    <TableHead className="px-4">Approved By</TableHead>
                    <TableHead className="px-4 min-w-40">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="px-4 text-xs text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="text-sm text-foreground">
                          {row.roll}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {row.studentName}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-sm">
                        {row.markTypeName}
                      </TableCell>
                      <TableCell className="px-4 text-center text-sm tabular-nums text-muted-foreground">
                        {formatValue(row.oldMark, row.oldAbsent)}
                      </TableCell>
                      <TableCell className="px-4 text-center text-sm font-medium tabular-nums">
                        {formatValue(row.newMark, row.newAbsent)}
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="text-sm text-foreground">
                          {row.editedByName}
                        </span>
                        <span className="block">
                          <Badge
                            variant={
                              row.editedByRole === "admin"
                                ? "default"
                                : "outline"
                            }
                            className="h-auto px-1.5 py-0 text-[10px] font-semibold"
                          >
                            {row.editedByRole === "admin" ? "Admin" : "Teacher"}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-sm text-muted-foreground">
                        {row.approvedByName ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 text-xs text-muted-foreground">
                        {row.reason ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// a cell that did not exist before shows as a dash rather than as 0
function formatValue(mark: number | null, absent: boolean | null) {
  if (mark === null && absent === null) return "—";
  if (absent) return "Absent";
  return mark === null ? "—" : String(mark);
}

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
