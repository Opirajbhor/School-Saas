import Link from "next/link";
import { Lifebuoy, Ticket } from "@phosphor-icons/react/ssr";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { getSessionContext } from "@/src/server-actions/shared/get-session-context.action";
import { formatDate } from "@/src/lib/date";
import { listTickets, getSupportCounters } from "../_actions/ticket.action";
import { ticketFilterZod, CATEGORY_LABELS } from "../_schema/ticket.zod";
import { AgeingTag, TicketPriorityPill, TicketStatusPill } from "./ticket-badges";
import { TicketFilters } from "./ticket-filters";
import { NewTicketDialog } from "./new-ticket-dialog";

/**
 * The ticket list, shared by `/dashboard/support` and `/super-admin/support`.
 * Role scoping lives in the action, so the two routes render the same code and
 * only differ in their base path.
 */
export async function SupportList({
  basePath,
  isSuper,
  searchParams,
}: {
  basePath: string;
  isSuper: boolean;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = ticketFilterZod.parse({
    q: pick("q"),
    status: pick("status") ?? "ALL",
    priority: pick("priority") ?? "ALL",
    category: pick("category") ?? "ALL",
    scope: pick("scope") ?? "ALL",
    from: pick("from"),
    to: pick("to"),
    page: pick("page") ?? 1,
    perPage: 10,
  });

  const [ctx, list, counters] = await Promise.all([
    getSessionContext(),
    listTickets(filters),
    getSupportCounters(),
  ]);

  const isAdmin = ctx?.role === "admin" || ctx?.role === "superadmin";
  const items = list.success ? list.data.items : [];
  const total = list.success ? list.data.total : 0;
  const pages = list.success ? list.data.pages : 1;

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (first && key !== "page") params.set(key, first);
    }
    if (page > 1) params.set("page", String(page));
    return `${basePath}${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={isSuper ? "Platform support" : "Support"}
        subtitle={
          isSuper
            ? "Every ticket on the platform — escalated institute issues included."
            : "Questions and problems from teachers, answered by the institute."
        }
        actions={
          <NewTicketDialog
            canPickScope={isAdmin && !isSuper}
            redirectBase={basePath}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Open"
          value={metricValue(counters.success ? counters.data.open : 0)}
          icon={Lifebuoy}
          footer={
            <p className="text-xs text-muted-foreground">open or in progress</p>
          }
        />
        <Metric
          label="Overdue"
          value={metricValue(counters.success ? counters.data.overdue : 0)}
          icon={Lifebuoy}
          footer={
            <p className="text-xs text-muted-foreground">
              past the response target
            </p>
          }
        />
        <Metric
          label="Resolved this week"
          value={metricValue(counters.success ? counters.data.resolvedWeek : 0)}
          icon={Lifebuoy}
          footer={
            <p className="text-xs text-muted-foreground">last 7 days</p>
          }
        />
        <Metric
          label="Assigned to me"
          value={metricValue(counters.success ? counters.data.assignedToMe : 0)}
          icon={Lifebuoy}
          footer={<p className="text-xs text-muted-foreground">still open</p>}
        />
      </div>

      <TicketFilters
        basePath={basePath}
        isSuper={isSuper}
        values={{
          q: filters.q,
          status: filters.status,
          priority: filters.priority,
          category: filters.category,
          scope: filters.scope,
          from: filters.from,
          to: filters.to,
        }}
      />

      {!list.success ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {list.error}
        </Card>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Ticket className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {total === 0 ? "No tickets yet" : "No tickets match these filters"}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {total === 0
              ? "A teacher can raise one here, and the institute sees it immediately."
              : "Clear a filter or widen the dates to see more."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Ticket</th>
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Age</th>
                  <th className="px-3 py-2 font-medium">Assigned</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="max-w-80 px-3 py-2">
                      <Link
                        href={`${basePath}/${ticket.id}`}
                        className="block truncate font-medium text-foreground hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        #{ticket.id.slice(0, 8)} · {ticket.messageCount} message
                        {ticket.messageCount === 1 ? "" : "s"}
                        {ticket.scope === "PLATFORM" ? " · platform" : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{ticket.createdByName}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[
                        ticket.category as keyof typeof CATEGORY_LABELS
                      ] ?? ticket.category}
                    </td>
                    <td className="px-3 py-2">
                      <TicketPriorityPill priority={ticket.priority} />
                    </td>
                    <td className="px-3 py-2">
                      <TicketStatusPill status={ticket.status} />
                    </td>
                    <td className="px-3 py-2">
                      <AgeingTag
                        overdue={ticket.overdue}
                        createdAt={ticket.createdAt}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {ticket.assignedToName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(ticket.lastReplyAt ?? ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              {total} ticket{total === 1 ? "" : "s"} · page {filters.page} of{" "}
              {pages}
            </p>
            <div className="flex items-center gap-1">
              {filters.page > 1 && (
                <Link
                  href={pageHref(filters.page - 1)}
                  className="rounded-md border px-2 py-1 text-[11px] hover:bg-muted"
                >
                  Previous
                </Link>
              )}
              {filters.page < pages && (
                <Link
                  href={pageHref(filters.page + 1)}
                  className="rounded-md border px-2 py-1 text-[11px] hover:bg-muted"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}
