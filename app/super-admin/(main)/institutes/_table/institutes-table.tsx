"use client";

import { useState } from "react";
import { IoSearchOutline as Search } from "react-icons/io5";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/table/tanstack/data-table";
import { InstituteColumn, InstituteRow } from "./column";

export function InstitutesTable({ institutes }: { institutes: InstituteRow[] }) {
  const [search, setSearch] = useState("");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          All institutes
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {institutes.length}
        </span>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Search by name, EIIN or phone
        </p>
      </div>

      <DataTable
        columns={InstituteColumn}
        data={institutes}
        globalFilter={search}
        toolbar={() => (
          <div className="px-4 py-3">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search institutes..."
                className="pl-9"
              />
            </div>
          </div>
        )}
      />
    </Card>
  );
}
