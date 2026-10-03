"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
import StatusToggleModal from "@/components/modal/status-modal";
import { useQueryClient } from "@tanstack/react-query";
import { InsituteProfileUpdateType } from "@/src/validation/institute-profile.zod";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<
  DataTableFeatures,
  InsituteProfileUpdateType
>();

export const InstituteColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => row.index + 1,
  }),
  columnHelper.accessor("nameEnglish", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="English Name" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("eiin", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Eiin" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("phone", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
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
function ActionsCell({ item }: { item: InsituteProfileUpdateType }) {
  const queryClient = useQueryClient();

  return (
    <div className="flex gap-2">
      {/* {item?.id && (
        <StatusToggleModal
          id={item.id}
          onDelete={}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["classes", "sections"],
            });
          }}
        />
      )} */}
    </div>
  );
}
