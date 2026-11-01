"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import DeleteModal from "@/components/modal/delete-modal";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import {
  changeStatussubjects,
  deletesubjects,
} from "../_actions/subjects.action";
import { UncombineButton } from "./uncombine-button";

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

  columnHelper.accessor("combineLabel", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Combined" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => {
      const item = row.original;
      // only the first paper is the anchor; the second points at it
      if (!item.combineLabel) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <span className="text-xs text-muted-foreground">
          {item.combineLabel}
          {item.combineWith ? " (2nd)" : " (1st)"}
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

  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ActionsCell item={row.original} />
      </div>
    ),
  }),
]);

function ActionsCell({ item }: { item: OutputSubjectType }) {
  return (
    <div className="flex items-center gap-2">
      <StatusToggleModal
        id={item.id as string}
        onDelete={changeStatussubjects}
      />
      {item.status === "INACTIVE" && (
        <DeleteModal id={item.id as string} onDelete={deletesubjects} />
      )}
      {item.combineLabel && (
        <UncombineButton id={item.id as string} label={item.combineLabel} />
      )}
    </div>
  );
}
