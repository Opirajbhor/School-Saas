"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
import StatusToggleModal from "@/components/modal/status-modal";
import { useQueryClient } from "@tanstack/react-query";
import { academicSessionType } from "@/src/validation/academicSessions.zod";
import {
  changeStatusSession,
  deleteSession,
} from "../_actions/academicSession.action";
import DeleteModal from "@/components/modal/delete-modal";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<
  DataTableFeatures,
  academicSessionType
>();

export const SessionColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => row.index + 1,
  }),
  columnHelper.accessor("year", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Session Year" />
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
function ActionsCell({ item }: { item: academicSessionType }) {
  const queryClient = useQueryClient();

  return (
    <div className="flex gap-2">
      {item?.id && item.status === "ACTIVE" && (
        <StatusToggleModal
          id={item.id}
          onDelete={changeStatusSession}
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
          onDelete={deleteSession}
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

