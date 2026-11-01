"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import DeleteModal from "@/components/modal/delete-modal";
import { classesType } from "@/src/validation/classes.zod";
import { changeStatusClass, deleteClass } from "../_actions/classes.action";

const columnHelper = createColumnHelper<DataTableFeatures, classesType>();

export const ClassesColumn = columnHelper.columns([
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
      <DataTableColumnHeader column={column} title="Class" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name}</span>
    ),
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

function ActionsCell({ item }: { item: classesType }) {
  const queryClient = useQueryClient();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["default-classes"] });

  return (
    <div className="flex items-center gap-2">
      <StatusToggleModal
        id={item.id as string}
        onDelete={changeStatusClass}
        onSuccess={refresh}
      />
      {item.status === "INACTIVE" && (
        <DeleteModal
          id={item.id as string}
          onDelete={deleteClass}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
