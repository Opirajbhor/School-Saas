import { cn } from "@/src/lib/utils";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../_schema/ticket.zod";

const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
  IN_PROGRESS:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  RESOLVED:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  CLOSED:
    "bg-muted text-muted-foreground ring-border",
};

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  HIGH: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  MEDIUM:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  LOW: "bg-muted text-muted-foreground ring-border",
};

export function TicketStatusPill({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function TicketPriorityPill({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        PRIORITY_STYLE[priority],
        className,
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function TicketCategoryTag({ category }: { category: TicketCategory }) {
  return (
    <span className="text-[11px] text-muted-foreground">
      {CATEGORY_LABELS[category]}
    </span>
  );
}

/** Amber when past the response target, muted while still inside it. */
export function AgeingTag({
  overdue,
  createdAt,
}: {
  overdue: boolean;
  createdAt: Date | string;
}) {
  const created = new Date(createdAt);
  const days = Math.floor((Date.now() - created.getTime()) / 86_400_000);
  const label =
    days <= 0
      ? "today"
      : days === 1
        ? "1 day old"
        : `${days} days old`;

  return (
    <span
      className={cn(
        "text-[11px]",
        overdue
          ? "font-medium text-amber-700 dark:text-amber-400"
          : "text-muted-foreground",
      )}
    >
      {overdue ? `overdue · ${label}` : label}
    </span>
  );
}
