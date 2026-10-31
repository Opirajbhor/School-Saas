"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { OutputSubjectType } from "@/src/validation/subjects.zod";

const columnHelper = createColumnHelper<DataTableFeatures, OutputSubjectType>();

export const subjectsColumn = columnHelper.columns([
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
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.shortName}
        </p>
      </div>
    ),
  }),

  columnHelper.accessor("code", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
        {row.original.code}
      </span>
    ),
  }),

  columnHelper.accessor("instituteId", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Provider" />
    ),
    cell: ({ getValue }) => {
      const isCustom = Boolean(getValue<string | null>());
      return (
        <span className="text-xs text-muted-foreground">
          {isCustom ? "Custom" : "Default"}
        </span>
      );
    },
  }),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  }),
]);
