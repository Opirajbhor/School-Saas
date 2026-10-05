"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
import StatusToggleModal from "@/components/modal/status-modal";
import { useQueryClient } from "@tanstack/react-query";
import DeleteModal from "@/components/modal/delete-modal";
import { classesType } from "@/src/validation/classes.zod";
import { changeStatusClass, deleteClass } from "../_actions/classes.action";

const columnHelper = createColumnHelper<DataTableFeatures, classesType>();

export const ClassesColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => row.index + 1,
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Classes Name" />
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
function ActionsCell({ item }: { item: classesType }) {
  const queryClient = useQueryClient();

  return (
    <div className="flex gap-2">
      {item?.id && (
        <StatusToggleModal
          id={item.id}
          onDelete={changeStatusClass}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["classes", "sections"],
            });
          }}
        />
      )}
      {item?.id && item.status === "INACTIVE" && (
        <DeleteModal
          id={item.id}
          onDelete={deleteClass}
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
