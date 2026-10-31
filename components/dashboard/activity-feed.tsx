import { Card } from "@/components/ui/card";
import { readAuditLogs } from "@/src/server-actions/audit-logs/readAuditLog.action";
import {
  ClipboardList,
  GraduationCap,
  History,
  PencilLine,
  UserPlus,
} from "lucide-react";

// Entity → icon and verb. The old version also gave every entity its own
// colour, but chart-2/3/4 are all the same green, so the chips read as four
// shades of nothing. One neutral chip plus the entity word carries it better.
const entityIcon = {
  TEACHER: UserPlus,
  STUDENT: UserPlus,
  EXAM: ClipboardList,
  MARK: PencilLine,
  RESULT: GraduationCap,
  CLASS: ClipboardList,
} as const;

const actionVerb = {
  CREATE: "created",
  UPDATE: "updated",
  STATUS_CHANGE: "changed status of",
  DELETE: "deleted",
  LOGIN: "logged in",
} as const;

function timeAgo(date: Date) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export async function ActivityFeed() {
  const result = await readAuditLogs();
  const activities = result.success ? result.data : [];

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden p-0 lg:h-[26rem]">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="font-heading font-semibold text-foreground">Activity</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {activities.length}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">Latest</span>
      </div>

      {!result.success ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {result.error}
        </p>
      ) : activities.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <History className="size-5 text-muted-foreground/60" strokeWidth={1.75} />
          <p className="text-sm text-muted-foreground">No activity yet.</p>
          <p className="text-xs text-muted-foreground/80">
            Creating a class, student or exam shows up here.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
          {activities.map((activity) => {
            const Icon =
              entityIcon[activity.entity as keyof typeof entityIcon] ??
              ClipboardList;
            const verb =
              actionVerb[activity.action as keyof typeof actionVerb] ??
              activity.action.toLowerCase();

            return (
              <li
                key={activity.id}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/40"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] leading-5 text-foreground">
                    <span className="font-medium">
                      {activity.userName ?? "Unknown"}
                    </span>{" "}
                    <span className="text-muted-foreground">{verb}</span>{" "}
                    <span className="font-medium">
                      {activity.entity.toLowerCase()}
                    </span>
                  </p>
                </div>

                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {timeAgo(activity.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
