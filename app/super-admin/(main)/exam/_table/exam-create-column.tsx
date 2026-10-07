"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
import StatusToggleModal from "@/components/modal/status-modal";
import { OutputExamType } from "@/app/dashboard/exam/_schema/exam.zod";
import { ToggleExamStatus } from "../_actions/exam.action";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, OutputExamType>();

export const ExamCreateColumn = columnHelper.columns([
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
function ActionsCell({ item }: { item: OutputExamType }) {
  return (
    <div className="flex gap-2">
      {item?.id && (
        <StatusToggleModal id={item.id} onDelete={ToggleExamStatus} />
      )}
    </div>
  );
}
