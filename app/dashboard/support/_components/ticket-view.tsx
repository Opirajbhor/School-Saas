import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "@phosphor-icons/react/ssr";

import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/src/lib/date";
import { cn } from "@/src/lib/utils";
import { getAssignableStaff, getTicket } from "../_actions/ticket.action";
import { CATEGORY_LABELS } from "../_schema/ticket.zod";
import { AgeingTag, TicketPriorityPill, TicketStatusPill } from "./ticket-badges";
import { TicketActions } from "./ticket-actions";

/** One ticket: the thread, then the controls (staff only). */
export async function TicketView({
  ticketId,
  basePath,
  isSuper,
}: {
  ticketId: string;
  basePath: string;
  isSuper: boolean;
}) {
  const [result, staff] = await Promise.all([
    getTicket(ticketId),
    getAssignableStaff(),
  ]);

  if (!result.success) notFound();

  const { ticket, messages, viewer } = result.data;

  return (
    <main className="my-6 w-full max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
      <Link
        href={basePath}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All tickets
      </Link>

      <Card className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
              {ticket.subject}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              #{ticket.id.slice(0, 8)} · opened by {ticket.createdByName}
              {ticket.createdByEmail ? ` (${ticket.createdByEmail})` : ""} on{" "}
              {formatDateTime(ticket.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ticket.scope === "PLATFORM" && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/20 ring-inset">
                platform
              </span>
            )}
            <TicketStatusPill status={ticket.status} />
            <TicketPriorityPill priority={ticket.priority} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-[11px] text-muted-foreground">
          <span>
            Category{" "}
            <span className="text-foreground">
              {CATEGORY_LABELS[ticket.category] ?? ticket.category}
            </span>
          </span>
          <span>
            Assigned{" "}
            <span className="text-foreground">
              {ticket.assignedToName ?? "nobody"}
            </span>
          </span>
          <span>
            Due <span className="text-foreground">{formatDateTime(ticket.dueAt)}</span>
          </span>
          <AgeingTag overdue={ticket.overdue} createdAt={ticket.createdAt} />
          {ticket.reopenedCount > 0 && (
            <span>reopened {ticket.reopenedCount}×</span>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No messages yet.
            </Card>
          ) : (
            messages.map((message) => {
              const staffMessage =
                message.authorRole === "admin" ||
                message.authorRole === "superadmin";

              return (
                <Card
                  key={message.id}
                  className={cn(
                    "space-y-1.5 p-3",
                    message.isInternal &&
                      "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-foreground">
                      {message.authorName}
                    </p>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {message.authorRole}
                    </span>
                    {message.isInternal && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        <Lock className="size-2.5" />
                        internal
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm whitespace-pre-line text-foreground">
                    {message.body}
                  </p>

                  {message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {message.attachments.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.url}
                            alt={file.name}
                            className="h-16 w-24 rounded border object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {!staffMessage && !message.isInternal && null}
                </Card>
              );
            })
          )}
        </div>

        <TicketActions
          ticketId={ticket.id}
          status={ticket.status}
          scope={ticket.scope}
          assignedToId={ticket.assignedToId}
          staff={staff.success ? staff.data : []}
          isAdmin={viewer.isAdmin}
          isSuper={isSuper}
          basePath={basePath}
        />
      </div>
    </main>
  );
}
