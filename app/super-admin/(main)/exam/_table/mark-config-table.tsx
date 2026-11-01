"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass as Search } from "@phosphor-icons/react/ssr";

import { createColumnHelper } from "@tanstack/react-table";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/table/tanstack/data-table";
import type { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import MarkInputModal from "../_component/MarkInputModal";
import type { OutputDefaultMarkTypes } from "../_schema/markInput.zod";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  OutputDefaultMarkTypes
>();

function buildColumns(markTypeNames: string[]) {
  return columnHelper.columns([
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
        <DataTableColumnHeader column={column} title="Subject" />
      ),
      filterFn: "includesString",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {row.original.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {row.original.code}
          </p>
        </div>
      ),
    }),

    ...markTypeNames.map((markTypeName) =>
      columnHelper.display({
        id: `mark_${markTypeName}`,
        header: markTypeName,
        cell: ({ row }) => {
          const template = row.original.markTemplates.find(
            (item) => item.markType.name === markTypeName,
          );

          if (!template) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <span className="text-xs tabular-nums text-foreground">
              {template.fullMark}
              <span className="text-muted-foreground"> / {template.passMark}</span>
            </span>
          );
        },
      }),
    ),

    columnHelper.display({
      id: "configured",
      header: "Papers",
      cell: ({ row }) => {
        const count = row.original.markTemplates.length;

        return (
          <span
            className={
              count === 0
                ? "rounded border border-dashed px-1.5 py-0.5 text-[10px] text-muted-foreground"
                : "rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground"
            }
          >
            {count === 0 ? "none" : count}
          </span>
        );
      },
    }),

    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <MarkInputModal item={row.original} />
        </div>
      ),
    }),
  ]);
}

/** Subject × mark-type grid with its own search, since the columns depend on data. */
export function MarkConfigTable({ data }: { data: OutputDefaultMarkTypes[] }) {
  const [search, setSearch] = useState("");

  const markTypeNames = useMemo(
    () =>
      Array.from(
        new Set(data.flatMap((subject) => subject.markTemplates.map((t) => t.markType.name))),
      ).sort(),
    [data],
  );

  const columns = useMemo(() => buildColumns(markTypeNames), [markTypeNames]);

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Subject marks</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {data.length}
        </span>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          full mark / pass mark per paper
        </p>
      </div>

      <div className="px-4 pb-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subjects..."
            className="pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={data} globalFilter={search} />
    </Card>
  );
}
