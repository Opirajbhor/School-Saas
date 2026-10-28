import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";

// --- Step heading with numbered badge ---
export function StepHeading({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {step}
      </div>
      <div className="space-y-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{children}</CardDescription>
      </div>
    </div>
  );
}

// --- Per mark type status badge ---
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
  if (mark === undefined || value === 0) {
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
