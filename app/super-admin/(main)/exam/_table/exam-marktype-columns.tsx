"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import { OutputExamMarkTypes } from "../_schema/exam.zod";
import { ToggleExamtypeStatus } from "../_actions/exam.action";

const columnHelper = createColumnHelper<DataTableFeatures, OutputExamMarkTypes>();

export const ExamMarkTypeColumn = columnHelper.columns([
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
      <DataTableColumnHeader column={column} title="Mark type" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
        {row.original.name}
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
        <StatusToggleModal
          id={row.original.id}
          onDelete={ToggleExamtypeStatus}
          title="Change mark type status"
          description="Inactive mark types stop appearing on new mark configuration."
        />
      </div>
    ),
  }),
]);
