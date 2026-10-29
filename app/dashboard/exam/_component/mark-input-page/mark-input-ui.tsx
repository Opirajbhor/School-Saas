import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/utils";
import { useState } from "react";
import { MarkEntryStatus, OutputMarkEntrySheetType } from "../../_schema/exam.zod";

type CombinedPair = NonNullable<OutputMarkEntrySheetType["combined"]>;

// --- One compact control in the selection bar: label above, control below ---
export function ControlField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// --- Per mark type status badge, shown under each entered mark ---
export function MarkStatusBadge({
  absent,
  mark,
  passMark,
  fullMark,
}: {
  absent: boolean;
  mark: number | undefined;
  passMark: number;
  fullMark: number;
}) {
  if (absent) {
    return (
      <Badge variant="outline" className="text-[11px]">
        Absent
      </Badge>
    );
  }
  const value = Number(mark);
  if (mark === undefined || mark === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (Number.isNaN(value) || value < 0 || value > fullMark) {
    return (
      <Badge variant="destructive" className="text-[11px]">
        Invalid
      </Badge>
    );
  }
  if (value < passMark) {
    return (
      <Badge variant="destructive" className="text-[11px]">
        Below Pass
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[11px]">
      Present
    </Badge>
  );
}

// --- Sheet-level workflow state, shown in the toolbar ---
export function SheetStatusBadge({ status }: { status: MarkEntryStatus }) {
  if (status === "SUBMITTED") {
    return (
      <Badge className="text-[11px]">Submitted</Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px]">
      Draft
    </Badge>
  );
}

// --- The two papers of a combined subject, shown together ---
// Display only: each paper keeps its own marks. The combined value is their
// average, counting only the papers that were actually sat.
export function CombinedPairPanel({
  label,
  papers,
  students,
}: {
  label: string;
  papers: CombinedPair["papers"];
  students: CombinedPair["students"];
}) {
  const fullMark = papers.reduce((sum, paper) => sum + paper.fullMark, 0);
  const [showAll, setShowAll] = useState(false);
  // the panel sits above the sheet, so it only needs to summarise
  const visible = showAll ? students : students.slice(0, 5);

  const combinedTotal = (row: (typeof students)[number]) => {
    const sat = row.papers.filter(
      (paper) => paper.marks.length > 0 && !paper.absent,
    );
    if (sat.length === 0) return null;
    return Math.round(
      sat.reduce((sum, paper) => sum + (paper.total ?? 0), 0) / sat.length,
    );
  };

  if (students.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            combined subject · marks are entered paper by paper
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          combined / {fullMark}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Roll</TableHead>
              <TableHead className="min-w-40">Student</TableHead>
              {papers.map((paper, index) => (
                <TableHead key={paper.id} className="text-center">
                  {index === 0 ? "1st" : "2nd"} Paper
                  <span className="block text-xs font-normal text-muted-foreground">
                    / {paper.fullMark}
                  </span>
                </TableHead>
              ))}
              <TableHead className="text-center">Combined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => {
              const total = combinedTotal(row);
              return (
                <TableRow key={row.studentId}>
                  <TableCell className="text-center text-muted-foreground">
                    {row.roll}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {row.englishName}
                  </TableCell>
                  {row.papers.map((paper) => (
                    <TableCell
                      key={paper.id}
                      className="text-center tabular-nums"
                    >
                      {paper.total === null
                        ? "not entered"
                        : paper.absent
                          ? "absent"
                          : paper.total}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold tabular-nums text-foreground">
                    {total === null ? "no grade" : total}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {students.length > 5 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-7 text-xs"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll
            ? "Show fewer"
            : `Show all ${students.length} students`}
        </Button>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        Combined is the average of the papers sat. Enter and save each paper from
        its own sheet below.
      </p>
    </div>
  );
}
