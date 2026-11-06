"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, SpinnerGap } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TICKET_STATUSES, TicketStatus } from "../_schema/ticket.zod";
import {
  assignTicket,
  changeTicketStatus,
  escalateTicket,
  replyToTicket,
} from "../_actions/ticket.action";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

/** Reply box, status controls, assignment and escalation for one ticket. */
export function TicketActions({
  ticketId,
  status,
  scope,
  assignedToId,
  staff,
  isAdmin,
  isSuper,
  basePath,
}: {
  ticketId: string;
  status: TicketStatus;
  scope: string;
  assignedToId: string | null;
  staff: { userId: string; name: string }[];
  isAdmin: boolean;
  isSuper: boolean;
  basePath: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const send = async () => {
    if (body.trim().length === 0) return;
    setBusy(true);
    const result = await replyToTicket({
      ticketId,
      body,
      isInternal: internal,
      attachments: [],
    });
    setBusy(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not send the reply");
      return;
    }
    setBody("");
    setInternal(false);
    router.refresh();
  };

  const setStatus = async (next: TicketStatus) => {
    setPendingStatus(next);
    const result = await changeTicketStatus({ ticketId, status: next });
    setPendingStatus(null);

    if (!result.success) {
      toast.error(result.error ?? "Could not change the status");
      return;
    }
    toast.success(`Ticket ${STATUS_LABEL[next].toLowerCase()}`);
    router.refresh();
  };

  const assign = async (value: string) => {
    const result = await assignTicket({
      ticketId,
      assigneeId: value === "" ? null : value,
    });
    if (!result.success) {
      toast.error(result.error ?? "Could not assign the ticket");
      return;
    }
    toast.success(value === "" ? "Assignment cleared" : "Ticket assigned");
    router.refresh();
  };

  const escalate = async () => {
    const result = await escalateTicket(ticketId);
    if (!result.success) {
      toast.error(result.error ?? "Could not escalate the ticket");
      return;
    }
    toast.success("Sent to the platform team");
    router.refresh();
  };

  const closed = status === "CLOSED";

  return (
    <div className="space-y-3">
      <Card className="space-y-2 p-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={4000}
          placeholder={
            closed
              ? "Reopen the ticket to reply"
              : isAdmin
                ? "Reply to the teacher, or leave an internal note…"
                : "Add a reply…"
          }
          disabled={closed}
          className="resize-y text-sm"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isAdmin && !closed && (
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(event) => setInternal(event.target.checked)}
                  className="size-3.5 accent-[var(--primary)]"
                />
                Internal note (hidden from the teacher)
              </label>
            )}
          </div>

          <Button size="sm" onClick={send} disabled={closed || busy || !body.trim()}>
            {busy && <SpinnerGap className="animate-spin" />}
            {internal ? "Add note" : "Send reply"}
          </Button>
        </div>
      </Card>

      {isAdmin && (
        <Card className="space-y-3 p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {TICKET_STATUSES.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={option === status ? "default" : "outline"}
                  disabled={option === status || pendingStatus !== null}
                  onClick={() => setStatus(option)}
                >
                  {pendingStatus === option && (
                    <SpinnerGap className="animate-spin" />
                  )}
                  {STATUS_LABEL[option]}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Open → In progress → Resolved → Closed. A closed ticket can be
              reopened; anything else is refused by the server.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground">Assigned to</p>
            <select
              value={assignedToId ?? ""}
              onChange={(event) => assign(event.target.value)}
              className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            >
              <option value="">Unassigned</option>
              {staff.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          {!isSuper && scope === "INSTITUTE" && (
            <Button size="sm" variant="outline" onClick={escalate}>
              <ArrowUpRight />
              Escalate to platform
            </Button>
          )}
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground">
        Thread link:{" "}
        <span className="tabular-nums">
          {basePath}/{ticketId.slice(0, 8)}
        </span>
      </p>
    </div>
  );
}
