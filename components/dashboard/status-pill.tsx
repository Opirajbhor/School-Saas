import { cn } from "@/src/lib/utils";

/**
 * One status treatment for every list — a design.md tag badge: mint for live
 * rows, gray for parked ones, with a dot so it still reads at a glance.
 */
export function StatusPill({ status }: { status?: string }) {
  const active = status === "ACTIVE";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[11px] font-medium",
        active
          ? "border-[#1aae39]/25 bg-tint-mint text-[#146c2e] dark:border-[#1aae39]/30 dark:bg-[#13301f] dark:text-[#8fe3a5]"
          : "border-hairline bg-tint-gray text-steel dark:border-input dark:bg-muted dark:text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-[#1aae39]" : "bg-stone",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
