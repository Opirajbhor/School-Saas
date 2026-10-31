import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  Info,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type {
  AttentionItem,
  AttentionSeverity,
} from "@/app/dashboard/_lib/attention";

const severityStyle: Record<
  AttentionSeverity,
  { tag: string; icon: typeof Info }
> = {
  critical: {
    tag: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: CircleAlert,
  },
  action: {
    tag: "border-primary/30 bg-primary/10 text-primary",
    icon: CircleDot,
  },
  info: {
    tag: "border-border bg-muted text-muted-foreground",
    icon: Info,
  },
};

/**
 * The dashboard's work queue: what an admin would otherwise have to hunt for
 * across five pages. Every row is derived from a live count, never stored.
 */
export function AttentionQueue({ items }: { items: AttentionItem[] }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Needs your attention
        </h2>
        {items.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {items.length}
          </span>
        )}
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Derived from live exam and staffing data
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-6">
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Nothing needs you right now.
            </p>
            <p className="text-xs text-muted-foreground">
              Every exam is published or in progress, and every section has a
              class teacher.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((item) => {
            const style = severityStyle[item.severity];
            const Icon = style.icon;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-4"
              >
                <span
                  className={cn(
                    "inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    style.tag,
                  )}
                >
                  <Icon className="size-3" />
                  {item.tag}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>

                <Link
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {item.cta}
                  <ArrowRight className="size-3.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
