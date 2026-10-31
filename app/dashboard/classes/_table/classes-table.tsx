"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { DataTable } from "@/components/table/tanstack/data-table";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import { columns } from "./columns";

/**
 * The classes page is a server component, so the search state lives in this
 * small client wrapper rather than the page.
 */
export function ClassesTable({ classes }: { classes: classesTypeWithId[] }) {
  const [search, setSearch] = useState("");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">All classes</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {classes.length}
        </span>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Add a section from any row
        </p>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        globalFilter={search}
        toolbar={() => (
          <div className="px-4 py-3">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search classes or sections..."
                className="pl-9"
              />
            </div>
          </div>
        )}
      />
    </Card>
  );
}
