"use client";

import {
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type Updater,
  type Table as TableInstance,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { features, type DataTableFeatures } from "./data-table-features";
import { useState } from "react";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  filterColumn?: string;
  filterPlaceholder?: string;
  /** Rendered above the table. Receives the table so it can read/write filters. */
  toolbar?: (table: TableInstance<DataTableFeatures, TData>) => React.ReactNode;
  /** Pass together with `onColumnFiltersChange` to control filtering from outside. */
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  /** Columns to hide on first render, e.g. filter-only columns. */
  initialColumnVisibility?: ColumnVisibilityState;
  /** Free-text search across every column. */
  globalFilter?: string;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Search...",
  toolbar,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  initialColumnVisibility,
  globalFilter,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([]);

  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  // TanStack hands back either a value or an updater fn, so resolve both.
  const setColumnFilters = (updater: Updater<ColumnFiltersState>) => {
    const next =
      typeof updater === "function" ? updater(columnFilters) : updater;
    setInternalColumnFilters(next);
    onColumnFiltersChange?.(next);
  };

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: "includesString",

    initialState: initialColumnVisibility
      ? { columnVisibility: initialColumnVisibility }
      : undefined,

    state: {
      sorting,
      columnFilters,
      ...(globalFilter !== undefined ? { globalFilter } : {}),
    },
  });
  return (
    <>
      {toolbar?.(table)}

      {/* table  body */}
      <div className="overflow-x-auto border-t">
        {/* filter */}

        {filterColumn && (
          <div className="p-3">
            <Input
              placeholder={filterPlaceholder}
              value={
                (table.getColumn(filterColumn)?.getFilterValue() as string) ??
                ""
              }
              onChange={(e) =>
                table.getColumn(filterColumn)?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-medium text-foreground">
                      No results
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try a different search, or add a record.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* pagination */}
      <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5">
        <p className="text-xs tabular-nums text-muted-foreground">
          {table.getRowModel().rows.length} of {data.length}{" "}
          {data.length === 1 ? "row" : "rows"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
