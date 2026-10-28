import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/utils";
import { MarkEntryStatus } from "../../_schema/exam.zod";

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
