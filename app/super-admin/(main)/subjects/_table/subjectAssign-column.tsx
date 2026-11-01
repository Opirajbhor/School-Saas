"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { UnassignButton } from "./unassign-button";

/** shape returned by getDefaultAssignSubjects */
export type AssignRow = {
  id: string;
  classId: string;
  subjectId: string;
  className: string;
  groupName: string;
  subjectName: string;
  subjectType: string;
  isOptional: boolean;
  isReligion: boolean;
  status: string;
};

const columnHelper = createColumnHelper<DataTableFeatures, AssignRow>();

export const subjectsAssignColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {row.index + 1}
      </span>
    ),
  }),

  columnHelper.accessor("className", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Class" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.className}</span>
    ),
  }),

  columnHelper.accessor("subjectName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.subjectName}</span>
    ),
  }),

  columnHelper.accessor("subjectType", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="rounded border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
        {row.original.subjectType === "GROUP_BASED"
          ? "Group based"
          : "Compulsory"}
      </span>
    ),
  }),

  columnHelper.accessor("groupName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Group" />
    ),
    filterFn: "includesString",
    cell: ({ row }) =>
      row.original.groupName ? (
        <span className="text-xs text-muted-foreground">
          {row.original.groupName}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  }),

  columnHelper.display({
    id: "flags",
    header: "Flags",
    cell: ({ row }) => {
      const { isOptional, isReligion } = row.original;
      if (!isOptional && !isReligion) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {isReligion && (
            <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              religion
            </span>
          )}
          {isOptional && (
            <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              optional
            </span>
          )}
        </div>
      );
    },
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
        <UnassignButton
          classId={row.original.classId}
          subjectId={row.original.subjectId}
          subjectName={row.original.subjectName}
          className={row.original.className}
        />
      </div>
    ),
  }),
]);
