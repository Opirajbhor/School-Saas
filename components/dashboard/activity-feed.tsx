import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/src/lib/utils";
import { readAuditLogs } from "@/src/server-actions/audit-logs/readAuditLog.action";
import {
  ClipboardList,
  GraduationCap,
  PencilLine,
  UserPlus,
} from "lucide-react";

// Map entity → icon
const entityIcon = {
  TEACHER: UserPlus,
  STUDENT: UserPlus,
  EXAM: ClipboardList,
  MARK: PencilLine,
  RESULT: GraduationCap,
  CLASS: ClipboardList,
} as const;

// Map entity → color
const entityStyle = {
  TEACHER: "bg-chart-2/15 text-chart-2",
  STUDENT: "bg-chart-2/15 text-chart-2",
  EXAM: "bg-primary/10 text-primary",
  MARK: "bg-chart-4/15 text-chart-4",
  RESULT: "bg-chart-3/10 text-chart-3",
  CLASS: "bg-primary/10 text-primary",
} as const;

// Map action → verb
const actionVerb = {
  CREATE: "created",
  UPDATE: "updated",
  STATUS_CHANGE: "changed status of",
  DELETE: "deleted",
  LOGIN: "logged in",
} as const;

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  const activities = result.data;

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ol className="relative flex flex-col gap-5">
          {activities.map((activity) => {
            const Icon =
              entityIcon[activity.entity as keyof typeof entityIcon] ??
              ClipboardList;
            const style =
              entityStyle[activity.entity as keyof typeof entityStyle] ??
              "bg-muted text-muted-foreground";
            const verb =
              actionVerb[activity.action as keyof typeof actionVerb] ??
              activity.action.toLowerCase();

            return (
              <li key={activity.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    style,
                  )}
                >
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">
                    <span className="font-medium">
                      {activity.userName ?? "Unknown"}
                    </span>{" "}
                    <span className="text-muted-foreground">{verb}</span>{" "}
                    <span className="font-medium">
                      {activity.entity.toLowerCase()}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {timeAgo(activity.createdAt)}
                  </p>
                </div>

                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                    {getInitials(activity.userName)}
                  </AvatarFallback>
                </Avatar>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
