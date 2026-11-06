"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react/ssr";

import {
  CATEGORY_LABELS,
  InputCreateTicketType,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../_schema/ticket.zod";

/**
 * Filter bar for the ticket list. Every control writes the query string, so the
 * list itself stays a server component and a filtered view is a URL you can
 * bookmark or send to someone.
 */
export function TicketFilters({
  basePath,
  isSuper,
  values,
}: {
  basePath: string;
  isSuper: boolean;
  values: {
    q?: string;
    status?: string;
    priority?: string;
    category?: string;
    scope?: string;
    from?: string;
    to?: string;
  };
}) {
  const router = useRouter();
  const [q, setQ] = useState(values.q ?? "");

  const push = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...values, ...patch };

    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "ALL") params.set(key, value);
    }
    // any filter change starts from page 1
    router.push(`${basePath}${params.size ? `?${params.toString()}` : ""}`);
  };

  const selectClass =
    "h-8 w-full rounded-md border bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring";

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
          placeholder="Search subject, description, sender…"
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
        aria-label="Status"
        className={selectClass + " w-32"}
        value={values.status ?? "ALL"}
        onChange={(event) => push({ status: event.target.value })}
      >
        <option value="ALL">All statuses</option>
        {TICKET_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status.replace("_", " ").toLowerCase()}
          </option>
        ))}
      </select>

      <select
        aria-label="Priority"
        className={selectClass + " w-28"}
        value={values.priority ?? "ALL"}
        onChange={(event) => push({ priority: event.target.value })}
      >
        <option value="ALL">Priority</option>
        {TICKET_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority.toLowerCase()}
          </option>
        ))}
      </select>

      <select
        aria-label="Category"
        className={selectClass + " w-32"}
        value={values.category ?? "ALL"}
        onChange={(event) => push({ category: event.target.value })}
      >
        <option value="ALL">Category</option>
        {TICKET_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>

      {isSuper && (
        <select
          aria-label="Scope"
          className={selectClass + " w-32"}
          value={values.scope ?? "ALL"}
          onChange={(event) => push({ scope: event.target.value })}
        >
          <option value="ALL">All scopes</option>
          <option value="INSTITUTE">Institute</option>
          <option value="PLATFORM">Platform</option>
        </select>
      )}

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
    </div>
  );
}

export type TicketFormValues = InputCreateTicketType;
