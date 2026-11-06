import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react/ssr";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { submissionFilterZod } from "./_schema/approval.zod";
import {
  getApprovalFilterOptions,
  listMarkSubmissions,
} from "./_actions/approval.action";
import { ApprovalTable } from "./_components/approval-table";

const STATUS_OPTIONS = [
  ["ALL", "Any status"],
  ["PENDING", "Pending"],
  ["APPROVED", "Approved"],
  ["REJECTED", "Rejected"],
  ["REOPENED", "Reopened"],
] as const;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const query = await searchParams;
  const pick = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = submissionFilterZod.safeParse({
    q: pick("q"),
    examId: pick("examId"),
    classId: pick("classId"),
    subjectId: pick("subjectId"),
    teacherId: pick("teacherId"),
    status: pick("status") ?? "ALL",
    from: pick("from"),
    to: pick("to"),
    sort: pick("sort") ?? "submitted",
    dir: pick("dir") ?? "desc",
    page: pick("page") ?? 1,
    perPage: 10,
  });

  const filters = parsed.success
    ? parsed.data
    : submissionFilterZod.parse({ status: "ALL", sort: "submitted", dir: "desc" });

  const [result, options] = await Promise.all([
    listMarkSubmissions(filters),
    getApprovalFilterOptions(),
  ]);

  const rows = result.success ? result.data.items : [];
  const total = result.success ? result.data.total : 0;
  const pages = result.success ? result.data.pages : 1;
  const pending = result.success ? result.data.pending : 0;

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (first && key !== "page") params.set(key, first);
    }
    if (page > 1) params.set("page", String(page));
    return `/dashboard/mark-approval${params.size ? `?${params.toString()}` : ""}`;
  };

  const opts = options.success ? options.data : { exams: [], classes: [], subjects: [], teachers: [] };

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Mark approval"
        subtitle="Review what teachers submitted: approve to lock the marks, or reject with a reason so they can correct and resubmit."
        actions={
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
            <CheckCircle className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {pending}
            </span>
            <span className="text-[11px] text-muted-foreground">waiting</span>
          </div>
        }
      />

      <form
        className="grid gap-2 rounded-lg border bg-card p-2 sm:grid-cols-2 lg:grid-cols-4"
        action="/dashboard/mark-approval"
      >
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search subject, teacher, exam…"
          className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus-visible:border-ring lg:col-span-2"
        />
        <select
          name="examId"
          defaultValue={filters.examId ?? ""}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="">All exams</option>
          {opts.exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name}
            </option>
          ))}
        </select>
        <select
          name="classId"
          defaultValue={filters.classId ?? ""}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="">All classes</option>
          {opts.classes.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select
          name="subjectId"
          defaultValue={filters.subjectId ?? ""}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="">All subjects</option>
          {opts.subjects.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select
          name="teacherId"
          defaultValue={filters.teacherId ?? ""}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="">All teachers</option>
          {opts.teachers.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <input
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            aria-label="Submitted from"
            className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs"
          />
          <span className="text-[10px] text-muted-foreground">→</span>
          <input
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
            aria-label="Submitted to"
            className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs"
          />
        </div>
        <div className="flex gap-1 lg:col-span-2">
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
          <Link
            href="/dashboard/mark-approval"
            className="inline-flex h-8 items-center rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </Link>
        </div>
      </form>

      {!result.success ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {result.error}
        </Card>
      ) : (
        <>
          <ApprovalTable rows={rows} sort={filters.sort} dir={filters.dir} />

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {total} sheet{total === 1 ? "" : "s"} · page {filters.page} of {pages}
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
        </>
      )}
    </main>
  );
}
