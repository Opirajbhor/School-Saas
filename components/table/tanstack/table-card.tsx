"use client";

import { useState } from "react";
import { MagnifyingGlass as Search } from "@phosphor-icons/react/ssr";

import type { ColumnDef, RowData } from "@tanstack/react-table";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/table/tanstack/data-table";
import type { DataTableFeatures } from "@/components/table/tanstack/data-table-features";

/**
 * Card + search + DataTable, so every list page in the platform admin looks and
 * behaves the same. The pages around it are server components, which is why the
 * search state lives here.
 */
export function TableCard<TData extends RowData>({
  title,
  hint,
  searchPlaceholder = "Search...",
  columns,
  data,
}: {
  title: string;
  hint?: string;
  searchPlaceholder?: string;
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
}) {
  const [search, setSearch] = useState("");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {data.length}
        </span>
        {hint && (
          <p className="text-xs text-muted-foreground sm:ml-auto">{hint}</p>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        globalFilter={search}
        toolbar={() => (
          <div className="px-4 py-3">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          </div>
        )}
      />
    </Card>
  );
}
