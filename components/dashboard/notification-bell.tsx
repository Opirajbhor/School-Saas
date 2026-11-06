"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateTime } from "@/src/lib/date";
import { cn } from "@/src/lib/utils";
import {
  getNotifications,
  markNotificationsRead,
} from "@/src/server-actions/shared/notification.action";

/**
 * In-app notifications: replies, status changes and assignments land here.
 * Polled every minute — the volume is low and it keeps the shell server-free.
 */
export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const items = await getNotifications();
      return items;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const items = data ?? [];
  const unread = items.filter((item) => !item.readAt).length;

  const open = async (href: string | null, id: string) => {
    await markNotificationsRead([id]);
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    if (href) router.push(href);
    else router.refresh();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative text-muted-foreground"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-xs font-medium text-foreground">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={async () => {
                await markNotificationsRead();
                await queryClient.invalidateQueries({
                  queryKey: ["notifications"],
                });
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nothing yet. Replies and status changes show up here.
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => open(item.href, item.id)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left last:border-0 hover:bg-muted/60",
                  !item.readAt && "bg-primary/5",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {!item.readAt && (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <span className="truncate text-xs font-medium text-foreground">
                    {item.title}
                  </span>
                </span>
                {item.body && (
                  <span className="line-clamp-2 text-[11px] text-muted-foreground">
                    {item.body}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatDateTime(item.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t px-3 py-2">
          <Link
            href="/dashboard/support"
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Open support →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
