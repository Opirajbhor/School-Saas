import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, PushPin } from "@phosphor-icons/react/ssr";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDate } from "@/src/lib/date";
import { cn } from "@/src/lib/utils";
import {
  instituteNoticeFilterZod,
  PRIORITY_LABELS,
} from "@/app/super-admin/(main)/notices/_schema/notice.zod";
import { listNotices } from "./_actions/notice.action";
import { NoticeFilters } from "./_components/notice-filters";

const PRIORITY_STYLE: Record<string, string> = {
  URGENT:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  IMPORTANT:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  NORMAL: "bg-muted text-muted-foreground ring-border",
};

// Notices from the platform. Unread first (they are pinned above everything by
// the action), with the read state shown per institute.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer(["admin", "user"]);
  if (!allowed) redirect("/unauthorize");

  const query = await searchParams;
  const pick = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = instituteNoticeFilterZod.parse({
    q: pick("q"),
    priority: pick("priority") ?? "ALL",
    read: pick("read") ?? "ALL",
    from: pick("from"),
    to: pick("to"),
    page: pick("page") ?? 1,
    perPage: 10,
  });

  const result = await listNotices(filters);
  const items = result.success ? result.data.items : [];
  const unread = result.success ? result.data.unread : 0;
  const pages = result.success ? result.data.pages : 1;

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (first && key !== "page") params.set(key, first);
    }
    if (page > 1) params.set("page", String(page));
    return `/dashboard/notices${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <main className="my-6 w-full max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Notices"
        subtitle={
          unread > 0
            ? `${unread} unread notice${unread === 1 ? "" : "s"} from the platform`
            : "Announcements from the platform team"
        }
      />

      <NoticeFilters
        values={{
          q: filters.q,
          priority: filters.priority,
          read: filters.read,
          from: filters.from,
          to: filters.to,
        }}
      />

      {!result.success ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {result.error}
        </Card>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Megaphone className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No notices</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {filters.q || filters.priority !== "ALL" || filters.read !== "ALL"
              ? "Nothing matches these filters."
              : "The platform has not sent anything to your institute yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((notice) => (
            <Link
              key={notice.id}
              href={`/dashboard/notices/${notice.id}`}
              className="block"
            >
              <Card
                className={cn(
                  "space-y-1.5 p-3 transition-colors hover:border-primary/40 hover:bg-muted/30",
                  notice.unread && "border-primary/30 bg-primary/[0.03]",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {notice.unread && (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  {notice.pinned && (
                    <PushPin className="size-3.5 text-muted-foreground" />
                  )}
                  <p
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm text-foreground",
                      notice.unread ? "font-semibold" : "font-medium",
                    )}
                  >
                    {notice.title}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                      PRIORITY_STYLE[notice.priority],
                    )}
                  >
                    {PRIORITY_LABELS[notice.priority]}
                  </span>
                </div>

                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {notice.preview}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  {formatDate(notice.publishAt)}
                  {notice.expiresAt
                    ? ` · expires ${formatDate(notice.expiresAt)}`
                    : ""}
                  {notice.readAt ? " · read" : ""}
                </p>
              </Card>
            </Link>
          ))}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted-foreground">
              page {filters.page} of {pages}
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
        </div>
      )}
    </main>
  );
}
