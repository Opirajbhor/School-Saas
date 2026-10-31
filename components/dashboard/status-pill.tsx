import { cn } from "@/src/lib/utils";

/**
 * One status treatment for every list. It replaced two different ones: a
 * filled primary blob on classes and a dot on teachers.
 */
export function StatusPill({ status }: { status?: string }) {
  const active = status === "ACTIVE";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground/40",
        )}
      />
      <span className={active ? "text-foreground" : "text-muted-foreground"}>
        {active ? "Active" : "Inactive"}
      </span>
    </span>
  );
}
