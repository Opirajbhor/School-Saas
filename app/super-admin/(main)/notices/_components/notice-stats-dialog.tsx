"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/src/lib/date";
import {
  archiveNotice,
  deleteNotice,
  getNoticeStats,
  publishNotice,
  toggleNoticePin,
} from "../_actions/notice.action";

type Stats = {
  delivered: number;
  read: number;
  unread: number;
  nonReaders: { instituteId: string; name: string; district: string }[];
  readers: { instituteId: string; name: string; readAt: Date | null }[];
};

/** Delivered / read / non-readers for one notice. */
export function NoticeStatsDialog({
  noticeId,
  title,
}: {
  noticeId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await getNoticeStats(noticeId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not load the stats");
      return;
    }
    setStats(result.data as Stats);
  };

  const percent =
    stats && stats.delivered > 0
      ? Math.round((stats.read / stats.delivered) * 100)
      : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) void load();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          stats
        </button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Delivery</DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>

        {loading || !stats ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            {loading ? "Loading…" : "No data"}
          </p>
        ) : (
          <div className="space-y-3 p-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Delivered", value: stats.delivered },
                { label: "Read", value: stats.read },
                { label: "Not read", value: stats.unread },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border p-2">
                  <p className="text-[11px] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Read rate</span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                Not read yet ({stats.nonReaders.length})
              </p>
              {stats.nonReaders.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Every institute has opened it.
                </p>
              ) : (
                <ul className="max-h-48 divide-y overflow-y-auto rounded-md border">
                  {stats.nonReaders.map((row) => (
                    <li
                      key={row.instituteId}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs"
                    >
                      <span className="truncate text-foreground">{row.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {row.district}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {stats.readers.length > 0 && (
              <details className="text-[11px] text-muted-foreground">
                <summary className="cursor-pointer">
                  Read by {stats.readers.length} institute
                  {stats.readers.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                  {stats.readers.map((row) => (
                    <li key={row.instituteId} className="flex justify-between gap-2">
                      <span className="truncate">{row.name}</span>
                      <span className="shrink-0 tabular-nums">
                        {row.readAt ? formatDateTime(row.readAt) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Pin / publish now / archive / delete for one row. */
export function NoticeRowActions({
  noticeId,
  pinned,
  state,
}: {
  noticeId: string;
  pinned: boolean;
  state: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>, message: string) => {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Action failed");
      return;
    }
    toast.success(message);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {state === "SCHEDULED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => run(() => publishNotice(noticeId), "Published")}
        >
          Publish now
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() =>
          run(() => toggleNoticePin(noticeId, !pinned), pinned ? "Unpinned" : "Pinned")
        }
      >
        {pinned ? "Unpin" : "Pin"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() =>
          run(
            () => archiveNotice(noticeId, state !== "ARCHIVED"),
            state === "ARCHIVED" ? "Unarchived" : "Archived",
          )
        }
      >
        {state === "ARCHIVED" ? "Unarchive" : "Archive"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={busy}
        onClick={() => run(() => deleteNotice(noticeId), "Deleted")}
      >
        Delete
      </Button>
    </div>
  );
}
