"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SuperAdminType } from "@/src/validation/superadmin.zod";
import DemoteButton from "./demote-button";
import { formatDate } from "@/src/lib/date";

const columnHelper = createColumnHelper<DataTableFeatures, SuperAdminType>();

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const SuperAdminColumn = columnHelper.columns([
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
      <DataTableColumnHeader column={column} title="Name" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px] font-semibold">
            {getInitials(row.original.name)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">
          {row.original.name}
        </span>
      </div>
    ),
  }),

  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email}</span>
    ),
  }),

  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Added" />
    ),
    cell: ({ getValue }) => {
      const value = getValue<Date>();
      return (
        <span className="text-xs tabular-nums text-muted-foreground">
          {value ? formatDate(value) : "—"}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        {row.original.id && (
          <DemoteButton id={row.original.id} email={row.original.email} />
        )}
      </div>
    ),
  }),
]);
