import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, PushPin } from "@phosphor-icons/react/ssr";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/src/lib/date";
import { cn } from "@/src/lib/utils";
import { PRIORITY_LABELS } from "@/app/super-admin/(main)/notices/_schema/notice.zod";
import { getNotice } from "../_actions/notice.action";
import { RichText } from "../_components/rich-text";

const PRIORITY_STYLE: Record<string, string> = {
  URGENT:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  IMPORTANT:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  NORMAL: "bg-muted text-muted-foreground ring-border",
};

// Reading a notice marks it read for the whole institute.
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { allowed } = await AccessServer(["admin", "user"]);
  if (!allowed) redirect("/unauthorize");

  const { id } = await params;
  const result = await getNotice(id);
  if (!result.success) notFound();

  const notice = result.data;

  return (
    <main className="my-6 w-full max-w-3xl space-y-4 px-4 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/notices"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All notices
      </Link>

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {notice.pinned && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <PushPin className="size-3" />
              pinned
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
              PRIORITY_STYLE[notice.priority],
            )}
          >
            {PRIORITY_LABELS[notice.priority]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatDateTime(notice.publishAt)}
            {notice.expiresAt
              ? ` · expires ${formatDateTime(notice.expiresAt)}`
              : ""}
          </span>
        </div>

        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
            {notice.title}
          </h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            From the platform team · {notice.createdByName} · addressed to{" "}
            {notice.instituteName}
          </p>
        </div>

        <div className="border-t pt-3">
          <RichText body={notice.body} />
        </div>

        {notice.attachments.length > 0 && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-foreground">
              Attachments
            </p>
            <div className="flex flex-wrap gap-2">
              {notice.attachments.map((file) => (
                <a
                  key={file.url}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-md border"
                  title={file.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-24 w-32 object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>

      <p className="text-[11px] text-muted-foreground">
        This notice is now marked read for {notice.instituteName}.
      </p>
    </main>
  );
}
