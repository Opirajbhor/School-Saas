"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { cn } from "@/utils/utils";
import AddClassSection from "../_component/add-section";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, classesTypeWithId>();

export const columns = columnHelper.columns([
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
  columnHelper.accessor(
    (row) => row.sections?.map((s) => s.name).join(", ") ?? "—",
    {
      id: "sections",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sections" />
      ),
      filterFn: "includesString",
    },
  ),
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
      return <ActionsCell item={item} />;
    },
  }),
]);

//===== actions ====
function ActionsCell({ item }: { item: classesTypeWithId }) {
  return (
    <div className="flex gap-2">
      <AddClassSection classData={item} />
    </div>
  );
}
