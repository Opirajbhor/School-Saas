import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, PushPin } from "@phosphor-icons/react/ssr";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/src/lib/date";
import { cn } from "@/src/lib/utils";
import {
  PRIORITY_LABELS,
  superNoticeFilterZod,
} from "./_schema/notice.zod";
import { getAudienceOptions, listNotices } from "./_actions/notice.action";
import { sweepNotices } from "./_lib/notice.internal";
import { NoticeComposer } from "./_components/notice-composer";
import {
  NoticeRowActions,
  NoticeStatsDialog,
} from "./_components/notice-stats-dialog";

const PRIORITY_STYLE: Record<string, string> = {
  URGENT:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  IMPORTANT:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  NORMAL: "bg-muted text-muted-foreground ring-border",
};

const STATE_STYLE: Record<string, string> = {
  LIVE: "text-emerald-700 dark:text-emerald-400",
  SCHEDULED: "text-amber-700 dark:text-amber-400",
  ARCHIVED: "text-muted-foreground",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer("superadmin");
  if (!allowed) redirect("/unauthorize");

  const query = await searchParams;
  const pick = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = superNoticeFilterZod.parse({
    q: pick("q"),
    priority: pick("priority") ?? "ALL",
    status: pick("status") ?? "ALL",
    page: pick("page") ?? 1,
    perPage: 10,
  });

  // publish anything due / archive anything expired before listing
  await sweepNotices();

  const [result, audience] = await Promise.all([
    listNotices(filters),
    getAudienceOptions(),
  ]);

  const items = result.success ? result.data.items : [];
  const total = result.success ? result.data.total : 0;
  const pages = result.success ? result.data.pages : 1;

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (first && key !== "page") params.set(key, first);
    }
    if (page > 1) params.set("page", String(page));
    return `/super-admin/notices${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Notices"
        subtitle="Broadcast to every institute or a chosen few — scheduled, pinned, with per-institute read stats."
        actions={
          <NoticeComposer
            institutes={
              audience.success
                ? audience.data.map((row) => ({
                    id: row.id,
                    name: row.name,
                    district: row.district,
                  }))
                : []
            }
          />
        }
      />

      <form
        className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2"
        action="/super-admin/notices"
      >
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search title or body…"
          className="h-8 min-w-52 flex-1 rounded-md border bg-background px-2 text-xs outline-none focus-visible:border-ring"
        />
        <select
          name="priority"
          defaultValue={filters.priority}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="ALL">All priorities</option>
          {(["NORMAL", "IMPORTANT", "URGENT"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="ALL">Any state</option>
          <option value="LIVE">Live</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Button type="submit" size="sm" variant="outline">
          Filter
        </Button>
      </form>

      {!result.success ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {result.error}
        </Card>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Megaphone className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No notices</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {total === 0
              ? "Compose one — it goes to every institute unless you pick a subset."
              : "Nothing matches these filters."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Notice</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Publish</th>
                  <th className="px-3 py-2 font-medium">State</th>
                  <th className="px-3 py-2 font-medium">Read / sent</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((notice) => (
                  <tr key={notice.id} className="border-b last:border-0 align-top">
                    <td className="max-w-80 px-3 py-2">
                      <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                        {notice.pinned && (
                          <PushPin className="size-3 shrink-0 text-muted-foreground" />
                        )}
                        {notice.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {notice.audience === "ALL"
                          ? "all institutes"
                          : "selected institutes"}
                        {notice.expiresAt
                          ? ` · expires ${formatDateTime(notice.expiresAt)}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                          PRIORITY_STYLE[notice.priority],
                        )}
                      >
                        {PRIORITY_LABELS[notice.priority]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateTime(notice.publishAt)}
                    </td>
                    <td className="px-3 py-2 text-[11px] font-medium">
                      <span className={STATE_STYLE[notice.state]}>
                        {notice.state.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums">
                      {notice.read} / {notice.delivered}{" "}
                      <NoticeStatsDialog
                        noticeId={notice.id}
                        title={notice.title}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <NoticeRowActions
                        noticeId={notice.id}
                        pinned={notice.pinned}
                        state={notice.state}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              {total} notice{total === 1 ? "" : "s"} · page {filters.page} of{" "}
              {pages}
            </p>
            <div className="flex gap-1">
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
