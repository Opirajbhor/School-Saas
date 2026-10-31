"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { subjectsColumn } from "./columns";

/**
 * The subjects page is a server component, so the search state lives here.
 */
export function SubjectsTable({
  subjects,
}: {
  subjects: OutputSubjectType[];
}) {
  const [search, setSearch] = useState("");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">All subjects</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {subjects.length}
        </span>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Search by name, code or short name
        </p>
      </div>

      <DataTable
        columns={subjectsColumn}
        data={subjects}
        globalFilter={search}
        toolbar={() => (
          <div className="px-4 py-3">
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
        )}
      />
    </Card>
  );
}
