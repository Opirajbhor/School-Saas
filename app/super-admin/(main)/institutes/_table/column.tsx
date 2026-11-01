"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { InferSelectModel } from "drizzle-orm";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import DeleteModal from "@/components/modal/delete-modal";
import { instituteProfile } from "@/src/drizzle-DB/schema";
import {
  changeStatusInstitute,
  deleteInstitute,
} from "../_actions/institute.action";

// the row shape, not the update schema: those fields are all optional
export type InstituteRow = InferSelectModel<typeof instituteProfile>;

const columnHelper = createColumnHelper<DataTableFeatures, InstituteRow>();

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

export const InstituteColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {row.index + 1}
      </span>
    ),
  }),

  columnHelper.accessor("nameEnglish", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Institute" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
          {initialsOf(row.original.nameEnglish)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {row.original.nameEnglish}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.nameBangla}
          </p>
        </div>
      </div>
    ),
  }),

  columnHelper.accessor("eiin", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="EIIN" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
        {row.original.eiin}
      </span>
    ),
  }),

  columnHelper.accessor("district", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.district}, {row.original.division}
      </span>
    ),
  }),

  columnHelper.accessor("phone", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {row.original.phone}
      </span>
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

function ActionsCell({ item }: { item: InstituteRow }) {
  const queryClient = useQueryClient();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["institutes"] });

  return (
    <div className="flex items-center gap-2">
      <StatusToggleModal
        id={item.id}
        onDelete={changeStatusInstitute}
        onSuccess={refresh}
      />
      {/* deleting is only offered once an institute is switched off */}
      {item.status === "INACTIVE" && (
        <DeleteModal
          id={item.id}
          onDelete={deleteInstitute}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
