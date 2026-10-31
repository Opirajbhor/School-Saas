"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import AddClassSection from "../_component/add-section";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, classesTypeWithId>();

export const columns = columnHelper.columns([
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

  columnHelper.accessor(
    (row) => row.sections?.map((s) => s.name).join(", ") ?? "",
    {
      id: "sections",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sections" />
      ),
      filterFn: "includesString",
      cell: ({ row }) => {
        const sections = row.original.sections ?? [];

        if (sections.length === 0) {
          return (
            <span className="text-xs text-muted-foreground">No sections</span>
          );
        }

        return (
          <div className="flex flex-wrap items-center gap-1">
            {sections.map((section) => (
              <span
                key={section.id}
                className="rounded border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {section.name}
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
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <AddClassSection classData={row.original} />
      </div>
    ),
  }),
]);
