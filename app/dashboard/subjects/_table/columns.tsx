"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
import { OutputSubjectType } from "@/src/validation/subjects.zod";

const columnHelper = createColumnHelper<DataTableFeatures, OutputSubjectType>();

export const subjectsColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => row.index + 1,
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("code", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
  }),
  columnHelper.accessor("shortName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Short Name" />
    ),
  }),

  columnHelper.accessor("instituteId", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Provider" />
    ),
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return <span>{value ? "Custom" : "Default"}</span>;
    },
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => {
      const status = getValue<"ACTIVE" | "INACTIVE">();
      return (
        <span
          className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            status === "ACTIVE"
              ? "bg-primary text-primary-foreground"
              : "bg-foreground text-background",
          )}
        >
          {status}
        </span>
      );
    },
  }),
]);
