"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { OutputGroupClassType } from "@/src/validation/groups.zod";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  OutputGroupClassType
>();

export const columns = columnHelper.columns([
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
      <DataTableColumnHeader column={column} title="Group" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
  }),

  columnHelper.accessor(
    (row) =>
      row.groupClasses
        ?.map((gc) => gc.class?.name)
        .filter(Boolean)
        .join(", ") ?? "",
    {
      id: "assignClasses",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned classes" />
      ),
      filterFn: "includesString",
      cell: ({ row }) => {
        const classes = (row.original.groupClasses ?? [])
          .map((gc) => gc.class?.name)
          .filter((name): name is string => Boolean(name));

        if (classes.length === 0) {
          return (
            <span className="text-xs text-muted-foreground">
              No classes assigned
            </span>
          );
        }

        return (
          <div className="flex flex-wrap items-center gap-1">
            {classes.map((name) => (
              <span
                key={name}
                className="rounded border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
  ),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  }),
]);
