"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import DeleteModal from "@/components/modal/delete-modal";
import { OutputGroupClassType } from "@/src/validation/groups.zod";
import { changeStatusGroups, deleteGroups } from "../_actions/groups.action";
import AssignGroups from "../assign-groups";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  OutputGroupClassType
>();

export const GroupsColumn = columnHelper.columns([
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
        ?.map((groupClass) => groupClass.class?.name)
        .filter(Boolean)
        .join(", ") ?? "",
    {
      id: "assignClasses",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Classes" />
      ),
      filterFn: "includesString",
      cell: ({ row }) => {
        const names = (row.original.groupClasses ?? [])
          .map((groupClass) => groupClass.class?.name)
          .filter((name): name is string => Boolean(name));

        if (names.length === 0) {
          return (
            <span className="text-xs text-muted-foreground">
              No classes assigned
            </span>
          );
        }

        return (
          <div className="flex flex-wrap items-center gap-1">
            {names.map((name) => (
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

function ActionsCell({ item }: { item: OutputGroupClassType }) {
  const queryClient = useQueryClient();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["default-groups"] });

  return (
    <div className="flex items-center gap-2">
      <AssignGroups group={item} />
      <StatusToggleModal
        id={item.id as string}
        onDelete={changeStatusGroups}
        onSuccess={refresh}
      />
      {item.status === "INACTIVE" && (
        <DeleteModal
          id={item.id as string}
          onDelete={deleteGroups}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
