"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
import StatusToggleModal from "@/components/modal/status-modal";
import { useQueryClient } from "@tanstack/react-query";
import { OutputExamType } from "../_schema/exam.zod";
import { ToggleExamStatus } from "../_actions/exam.action";
import ExamAssignToClass from "../_component/exam-assign-class";

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
  columnHelper.accessor("startDate", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Date" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => {
      const date = row.getValue<Date>("startDate");
      if (!date) return "—";
      return new Intl.DateTimeFormat("en-GB").format(date);
    },
  }),
  columnHelper.accessor("endDate", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Date" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => {
      const date = row.getValue<Date>("endDate");
      if (!date) return "—";
      return new Intl.DateTimeFormat("en-GB").format(date);
    },
  }),

  columnHelper.accessor("publishDate", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Result Publish Date" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => {
      const date = row.getValue<Date>("publishDate");
      if (!date) return "—";
      return new Intl.DateTimeFormat("en-GB").format(date);
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
    header: "Classes",
    id: "classes",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          {item.assignClasses
            ?.filter((c) => c.status === "ACTIVE")
            .map((c) => (
              <p key={c.classId} className="text-xs">
                {c.class?.name ?? "—"}
                {","}
              </p>
            ))}
        </div>
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
          <ExamAssignToClass {...item} />
          <ActionsCell item={item} />
        </div>
      );
    },
  }),
]);

//===== actions ====
function ActionsCell({ item }: { item: OutputExamType }) {
  const queryClient = useQueryClient();

  return (
    <div className="flex gap-2">
      {item?.id && (
        <StatusToggleModal
          id={item.id}
          onDelete={ToggleExamStatus}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["classes", "sections"],
            });
          }}
        />
      )}
    </div>
  );
}
