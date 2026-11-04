"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck as CalendarRange } from "@phosphor-icons/react/ssr";


import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import DeleteModal from "@/components/modal/delete-modal";
import { academicSessionType } from "@/src/validation/academicSessions.zod";
import { formatDate } from "@/src/lib/date";
import {
  changeStatusSession,
  deleteSession,
} from "../_actions/academicSession.action";

/**
 * Sessions are a short, ordered list — a table with SL and an empty Actions
 * column wastes most of its width on two rows.
 */
export function SessionsList({ sessions }: { sessions: academicSessionType[] }) {
  const queryClient = useQueryClient();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["sessions"] });

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {sessions.length}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          Newest year first
        </span>
      </div>

      <div className="divide-y">
        {sessions.map((session) => {
          const current = session.status === "ACTIVE";

          return (
            <div
              key={session.id ?? session.year}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span
                className={
                  current
                    ? "flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    : "flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                }
              >
                <CalendarRange className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {session.year}
                  </p>
                  {current && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      current
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Created {formatDate(session.createdAt)}
                </p>
              </div>

              <StatusPill status={session.status} />

              <div className="flex shrink-0 items-center gap-2">
                <StatusToggleModal
                  id={session.id as string}
                  onDelete={changeStatusSession}
                  onSuccess={refresh}
                />
                {session.status === "INACTIVE" && (
                  <DeleteModal
                    id={session.id as string}
                    onDelete={deleteSession}
                    onSuccess={refresh}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
