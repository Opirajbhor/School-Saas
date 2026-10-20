"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AppTableColumn<T> = {
  key: keyof T | string;
  label: string;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
};

type AppTableProps<T extends { id: string }> = {
  data: T[];
  columns: AppTableColumn<T>[];

  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];

  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  toolbar?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
};

export function AppTable<T extends { id: string }>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search...",
  searchKeys,
  selectable = false,
  selectedIds = [],
  toolbar,
  onSelectionChange,
  emptyMessage = "No results found.",
  className,
}: AppTableProps<T>) {
  const [search, setSearch] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;

    const query = search.toLowerCase();

    return data.filter((item) => {
      const keys = searchKeys ?? (Object.keys(item) as (keyof T)[]);

      return keys.some((key) =>
        String(item[key] ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [data, search, searchKeys]);

  const allSelected =
    filteredData.length > 0 &&
    filteredData.every((item) => selectedIds.includes(item.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;

    if (allSelected) {
      const visibleIds = new Set(filteredData.map((item) => item.id));

      onSelectionChange(selectedIds.filter((id) => !visibleIds.has(id)));

      return;
    }

    const ids = new Set(selectedIds);

    filteredData.forEach((item) => {
      ids.add(item.id);
    });

    onSelectionChange([...ids]);
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className={`${className} p-3`}>
      {(searchable || toolbar) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {searchable && (
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="max-w-sm"
            />
          )}

          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
              )}

              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={column.className}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => toggleRow(item.id)}
                      />
                    </TableCell>
                  )}

                  {columns.map((column) => (
                    <TableCell
                      key={`${item.id}-${String(column.key)}`}
                      className={column.className}
                    >
                      {column.render
                        ? column.render(item, index)
                        : String(item[column.key as keyof T] ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
