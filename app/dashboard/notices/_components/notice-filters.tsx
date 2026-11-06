"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checks, MagnifyingGlass, X } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NOTICE_PRIORITIES, PRIORITY_LABELS } from "@/app/super-admin/(main)/notices/_schema/notice.zod";
import { markAllNoticesRead } from "../_actions/notice.action";

/** Search / priority / read-state / date filters — all in the URL. */
export function NoticeFilters({
  values,
}: {
  values: {
    q?: string;
    priority?: string;
    read?: string;
    from?: string;
    to?: string;
  };
}) {
  const router = useRouter();
  const [q, setQ] = useState(values.q ?? "");
  const [busy, setBusy] = useState(false);

  const push = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...values, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "ALL") params.set(key, value);
    }
    router.push(`/dashboard/notices${params.size ? `?${params.toString()}` : ""}`);
  };

  const selectClass =
    "h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
      <form
        className="relative min-w-52 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          push({ q: q.trim() || undefined });
        }}
      >
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search notices…"
          className="h-8 w-full rounded-md border bg-background pr-7 pl-7 text-xs outline-none focus-visible:border-ring"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              push({ q: undefined });
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3" />
          </button>
        )}
      </form>

      <select
        aria-label="Priority"
        className={selectClass + " w-32"}
        value={values.priority ?? "ALL"}
        onChange={(event) => push({ priority: event.target.value })}
      >
        <option value="ALL">All priorities</option>
        {NOTICE_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_LABELS[priority]}
          </option>
        ))}
      </select>

      <select
        aria-label="Read state"
        className={selectClass + " w-28"}
        value={values.read ?? "ALL"}
        onChange={(event) => push({ read: event.target.value })}
      >
        <option value="ALL">All</option>
        <option value="UNREAD">Unread</option>
        <option value="READ">Read</option>
      </select>

      <input
        type="date"
        aria-label="From"
        className={selectClass + " w-36"}
        value={values.from ?? ""}
        onChange={(event) => push({ from: event.target.value || undefined })}
      />
      <input
        type="date"
        aria-label="To"
        className={selectClass + " w-36"}
        value={values.to ?? ""}
        onChange={(event) => push({ to: event.target.value || undefined })}
      />

      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await markAllNoticesRead();
          setBusy(false);
          if (!result.success) {
            toast.error(result.error ?? "Could not mark notices read");
            return;
          }
          toast.success(
            result.data.marked > 0
              ? `${result.data.marked} notice${result.data.marked === 1 ? "" : "s"} marked read`
              : "Everything was already read",
          );
          router.refresh();
        }}
      >
        <Checks />
        Mark all read
      </Button>
    </div>
  );
}
