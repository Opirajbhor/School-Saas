"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowClockwise,
  Check,
  CheckCircle,
  WarningCircle,
  X,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { formatDateCompact, formatDateTime } from "@/src/lib/date";
import {
  approveMarkSubmissions,
  getMarkSubmissionDetail,
  rejectMarkSubmissions,
  reopenMarkSubmissions,
} from "../_actions/approval.action";

type Row = {
  id: string;
  examName: string;
  className: string;
  sectionName: string;
  subjectName: string;
  teacherName: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REOPENED";
  resubmissionCount: number;
  studentCount: number;
  submittedAt: Date;
  decidedAt: Date | null;
  decisionNote: string | null;
  rosterChanged: boolean;
};

const STATUS_STYLE: Record<Row["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  REJECTED: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  REOPENED: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
};

const STATUS_LABEL: Record<Row["status"], string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REOPENED: "Reopened",
};

type Detail = {
  submission: Row & {
    examName: string;
    teacherNote: string | null;
    decidedByName: string | null;
    rosterChanged: boolean;
  };
  markTypes: { id: string; name: string; fullMark: number | null }[];
  students: {
    enrollmentId: string;
    roll: string;
    name: string;
    marks: {
      markTypeId: string;
      markTypeName: string;
      fullMark: number | null;
      mark: number | null;
      absent: boolean;
    }[];
  }[];
  events: {
    id: string;
    action: string;
    actorName: string;
    actorRole: string;
    note: string | null;
    createdAt: Date;
  }[];
};

export function ApprovalTable({
  rows,
  sort,
  dir,
}: {
  rows: Row[];
  sort: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, startTransition] = useTransition();

  const pendingRows = useMemo(
    () => rows.filter((row) => row.status === "PENDING" || row.status === "REOPENED"),
    [rows],
  );
  const approvedRows = useMemo(
    () => rows.filter((row) => row.status === "APPROVED"),
    [rows],
  );

  const allChecked = rows.length > 0 && selected.length === rows.length;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setLoadingDetail(true);
    const result = await getMarkSubmissionDetail(id);
    setLoadingDetail(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDetail(result.data as Detail);
  };

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, done: string) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        toast.error(result.error ?? "Action failed");
        return;
      }
      toast.success(done);
      setSelected([]);
      setRejectOpen(false);
      setReason("");
      setDetailId(null);
      router.refresh();
    });
  };

  const sortHref = (key: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("sort", key);
    params.set("dir", sort === key && dir === "desc" ? "asc" : "desc");
    return `?${params.toString()}`;
  };

  const header = (label: string, key: string, className?: string) => (
    <th className={cn("px-3 py-2 font-medium", className)}>
      <button
        type="button"
        onClick={() => router.push(sortHref(key))}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          sort === key && "text-foreground",
        )}
      >
        {label}
        <span className="text-[9px]">
          {sort === key ? (dir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );

  return (
    <>
      {selected.length > 0 && (
        <div className="sticky top-2 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-xs font-medium text-foreground">
            {selected.length} selected
          </p>
          <div className="ml-auto flex flex-wrap gap-1">
            <Button
              size="sm"
              disabled={busy || pendingRows.length === 0}
              onClick={() =>
                run(
                  () =>
                    approveMarkSubmissions(
                      selected.filter((id) =>
                        pendingRows.some((row) => row.id === id),
                      ),
                    ),
                  "Approved",
                )
              }
            >
              <Check className="size-3.5" /> Approve chosen
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
            >
              <X className="size-3.5" /> Reject…
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || approvedRows.length === 0}
              onClick={() =>
                run(
                  () =>
                    reopenMarkSubmissions(
                      selected.filter((id) =>
                        approvedRows.some((row) => row.id === id),
                      ),
                    ),
                  "Reopened",
                )
              }
            >
              <ArrowClockwise className="size-3.5" /> Reopen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected([])}
              disabled={busy}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="w-9 px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allChecked}
                    onChange={() =>
                      setSelected(allChecked ? [] : rows.map((row) => row.id))
                    }
                    className="size-3.5 accent-[var(--primary)]"
                  />
                </th>
                {header("Exam", "exam")}
                {header("Class / section", "section")}
                {header("Subject", "subject")}
                <th className="px-3 py-2 font-medium">Teacher</th>
                {header("Submitted", "submitted")}
                {header("Resubmits", "count", "text-center")}
                {header("Status", "status")}
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b last:border-0 align-middle hover:bg-muted/30",
                    selected.includes(row.id) && "bg-muted/40",
                  )}
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.subjectName}`}
                      checked={selected.includes(row.id)}
                      onChange={() => toggle(row.id)}
                      className="size-3.5 accent-[var(--primary)]"
                    />
                  </td>
                  <td className="max-w-48 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openDetail(row.id)}
                      className="truncate text-left font-medium text-foreground hover:underline"
                    >
                      {row.examName}
                    </button>
                    {row.rosterChanged && (
                      <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 text-[9px] font-medium text-amber-700 ring-1 ring-amber-200 ring-inset dark:bg-amber-950/40 dark:text-amber-300">
                        <WarningCircle className="size-2.5" /> roster changed
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.className} <span className="text-muted-foreground">· {row.sectionName}</span>
                  </td>
                  <td className="px-3 py-2">{row.subjectName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.teacherName}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                    {formatDateCompact(row.submittedAt)}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {row.resubmissionCount}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                        STATUS_STYLE[row.status],
                      )}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openDetail(row.id)}
                      className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      view
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-xs text-muted-foreground">
                    No mark sheets yet. They appear here once a teacher submits marks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------------------------------------------------------- drawer */}
      <Dialog open={detailId !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-5 py-3">
            <DialogTitle className="text-sm">
              {detail?.submission
                ? `${detail.submission.subjectName} · ${detail.submission.className} ${detail.submission.sectionName}`
                : "Mark sheet"}
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              {detail?.submission?.examName ?? ""}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail || !detail ? (
            <p className="p-8 text-center text-xs text-muted-foreground">
              {loadingDetail ? "Loading…" : "No data"}
            </p>
          ) : (
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium ring-1 ring-inset",
                    STATUS_STYLE[detail.submission.status],
                  )}
                >
                  {STATUS_LABEL[detail.submission.status]}
                </span>
                <span>{detail.submission.teacherName}</span>
                <span>· submitted {formatDateTime(detail.submission.submittedAt)}</span>
                <span>· {detail.students.length} students</span>
                <span>· {detail.submission.resubmissionCount} resubmit(s)</span>
                {detail.submission.rosterChanged && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <WarningCircle className="size-2.5" /> class list changed since submission
                  </span>
                )}
              </div>

              {detail.submission.teacherNote && (
                <div className="rounded-lg border bg-muted/40 p-2">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Teacher note
                  </p>
                  <p className="text-xs text-foreground">{detail.submission.teacherNote}</p>
                </div>
              )}

              {detail.submission.decisionNote && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950/40">
                  <p className="text-[10px] font-medium text-red-700 dark:text-red-300">
                    Rejection reason
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-200">
                    {detail.submission.decisionNote}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-1 text-xs font-medium text-foreground">
                  Student-wise marks
                </p>
                <div className="max-h-64 overflow-y-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/60 text-[10px] text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1 text-left font-medium">Roll</th>
                        <th className="px-2 py-1 text-left font-medium">Student</th>
                        {detail.markTypes.map((type) => (
                          <th key={type.id} className="px-2 py-1 text-center font-medium">
                            {type.name}
                            {type.fullMark != null && (
                              <span className="ml-0.5 text-muted-foreground/70">
                                /{type.fullMark}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.students.map((student) => (
                        <tr key={student.enrollmentId} className="border-t">
                          <td className="px-2 py-1 tabular-nums text-muted-foreground">
                            {student.roll}
                          </td>
                          <td className="px-2 py-1">{student.name}</td>
                          {student.marks.map((cell) => (
                            <td
                              key={cell.markTypeId}
                              className="px-2 py-1 text-center tabular-nums"
                            >
                              {cell.absent ? (
                                <span className="text-red-600 dark:text-red-400">AB</span>
                              ) : cell.mark == null ? (
                                <span className="text-muted-foreground/50">—</span>
                              ) : (
                                cell.mark
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-foreground">History</p>
                <ol className="space-y-1.5">
                  {detail.events.map((event) => (
                    <li key={event.id} className="flex items-start gap-2 text-[11px]">
                      <span
                        className={cn(
                          "mt-0.5 rounded px-1 py-px text-[9px] font-semibold uppercase",
                          event.action === "APPROVE" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                          event.action === "REJECT" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                          event.action === "REOPEN" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                          (event.action === "SUBMIT" || event.action === "RESUBMIT") &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {event.action}
                      </span>
                      <span className="text-foreground">{event.actorName}</span>
                      <span className="text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </span>
                      {event.note && (
                        <span className="text-muted-foreground">— {event.note}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <DialogFooter className="gap-2 border-t pt-3">
                {(detail.submission.status === "PENDING" ||
                  detail.submission.status === "REOPENED") && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => approveMarkSubmissions([detail.submission.id]),
                        "Approved",
                      )
                    }
                  >
                    <CheckCircle className="size-3.5" /> Approve
                  </Button>
                )}
                {detail.submission.status === "APPROVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => reopenMarkSubmissions([detail.submission.id]),
                        "Reopened",
                      )
                    }
                  >
                    <ArrowClockwise className="size-3.5" /> Reopen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setSelected([detail.submission.id]);
                    setRejectOpen(true);
                  }}
                >
                  <X className="size-3.5" /> Reject
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------ reject modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          <DialogHeader className="border-b px-5 py-3">
            <DialogTitle className="text-sm">Reject mark sheet</DialogTitle>
            <DialogDescription className="text-[11px]">
              The teacher sees this reason and can edit and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 p-5">
            <label htmlFor="reject-reason" className="text-xs font-medium text-foreground">
              Reason <span className="text-muted-foreground">(min 10 characters)</span>
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="e.g. Class 9 roll 12 is marked absent but sat the exam."
              className="w-full rounded-md border bg-background p-2 text-xs outline-none focus-visible:border-ring"
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {reason.trim().length}/600
            </p>
          </div>
          <DialogFooter className="gap-2 border-t px-5 py-3">
            <Button variant="ghost" size="sm" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy || reason.trim().length < 10}
              onClick={() =>
                run(
                  () =>
                    rejectMarkSubmissions(
                      selected.length > 0 ? selected : detailId ? [detailId] : [],
                      reason.trim(),
                    ),
                  "Rejected",
                )
              }
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
