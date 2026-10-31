import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export type BarSegment = { value: number; className: string };

/**
 * One KPI card, shared by every dashboard screen so the stat row looks the
 * same everywhere. The bar only renders when the proportion is real — a ratio
 * of two counts from the database, never a trend we do not store.
 */
export function Metric({
  label,
  value,
  icon: Icon,
  segments,
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  segments?: BarSegment[];
  footer: React.ReactNode;
}) {
  const total = segments?.reduce((sum, part) => sum + part.value, 0) ?? 0;

  return (
    <Card className="flex h-full flex-col justify-center gap-1 rounded-xl p-4">
      <div className="flex items-center gap-2">
        <Icon
          className="size-4 shrink-0 text-muted-foreground/70"
          strokeWidth={1.75}
        />
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="ml-auto hidden min-w-0 max-w-[60%] truncate text-right text-[11px] text-muted-foreground sm:block">
          {footer}
        </div>
      </div>

      <p className="text-xl font-bold leading-7 tabular-nums text-foreground">
        {value}
      </p>

      {segments && total > 0 && (
        <div
          className="mt-1 flex h-[3px] overflow-hidden rounded-full bg-muted"
          role="presentation"
        >
          {segments.map((part, index) => (
            <span
              key={index}
              className={part.className}
              style={{ width: `${(part.value / total) * 100}%` }}
            />
          ))}
        </div>
      )}

      <div className="mt-1 sm:hidden">{footer}</div>
    </Card>
  );
}

/** Formats a count for a metric value, with an em dash when it is unknown. */
export function metricValue(value?: number) {
  return typeof value === "number" ? value.toLocaleString("en-US") : "—";
}
