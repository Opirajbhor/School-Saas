"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
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
    cell: ({ row }) => row.index + 1,
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="subjects Name" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("code", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("shortName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Short Name" />
    ),
    filterFn: "includesString",
  }),

  columnHelper.accessor("combineLabel", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Combined" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => {
      const item = row.original;
      // only the first paper is the anchor; the second points at it
      if (!item.combineLabel) return <span>—</span>;
      return (
        <span className="text-xs">
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
  columnHelper.display({
    header: "Actions",
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2">
          <ActionsCell item={item} />
        </div>
      );
    },
  }),
]);

//===== actions ====
function ActionsCell({ item }: { item: OutputSubjectType }) {
  return (
    <div className="flex gap-2">
      {item?.id && (
        <StatusToggleModal id={item.id} onDelete={changeStatussubjects} />
      )}
      {item?.id && item.status === "INACTIVE" && (
        <DeleteModal id={item.id} onDelete={deletesubjects} />
      )}
      {item?.id && item.combineLabel && (
        <UncombineButton id={item.id} label={item.combineLabel} />
      )}
    </div>
  );
}
