"use client";
import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import MarkInputModal from "../_component/MarkInputModal";
import { OutputDefaultMarkType } from "../_schema/markInput.zod";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  OutputDefaultMarkType
>();

export function DefaultMarkCongfigColumn(markTypeNames: string[]) {
  return columnHelper.columns([
    columnHelper.display({
      id: "serial",
      header: "SL",
      cell: ({ row }) => row.index + 1,
    }),
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subject Name" />
      ),
      filterFn: "includesString",
    }),

    ...markTypeNames.map((mtName) =>
      columnHelper.accessor(
        (row) =>
          row.markTemplates.find((t) => t.markType.name === mtName)?.fullMark ??
          null,
        {
          id: `mark_${mtName}`,
          header: mtName,
          cell: ({ getValue }) => getValue() ?? "—",
        },
      ),
    ),

    columnHelper.display({
      header: "Mark Entry",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MarkInputModal item={row.original} />
        </div>
      ),
    }),
  ]);
}
