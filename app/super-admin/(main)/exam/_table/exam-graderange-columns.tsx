"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import { OutputExamGradeRangeType } from "../_schema/exam.zod";
import { ToggleGradeRangeStatus } from "../_actions/exam.action";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  OutputExamGradeRangeType
>();

export const ExamGradeRangeColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {row.index + 1}
      </span>
    ),
  }),

  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Grade" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="inline-flex min-w-7 items-center justify-center rounded border bg-muted/40 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
        {row.original.name}
      </span>
    ),
  }),

  columnHelper.display({
    id: "range",
    header: "Mark range",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-foreground">
        {row.original.minMark}–{row.original.maxMark}
      </span>
    ),
  }),

  columnHelper.accessor("GPA", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GPA" />
    ),
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {Number(row.original.GPA).toFixed(2)}
      </span>
    ),
  }),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  }),

  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        {row.original.id && (
          <StatusToggleModal
            id={row.original.id}
            onDelete={ToggleGradeRangeStatus}
            title="Change grade band status"
            description="Inactive bands are skipped when a GPA is calculated."
          />
        )}
      </div>
    ),
  }),
]);
