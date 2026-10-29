"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronDown, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { StudentEnrollment } from "@/src/validation/student.zod";
import type { ColumnFiltersState } from "@tanstack/react-table";

import Link from "next/link";
import { SpinnerCustom } from "@/components/Spinner";
import Title from "@/components/Title";
import { DataTable } from "@/components/table/tanstack/data-table";
import { studentColumns } from "./_table/columns";
import {
  HIDDEN_FILTER_COLUMNS,
  StudentFilters,
} from "./_table/student-filters";
import { useQuery } from "@tanstack/react-query";
import { getStudents, getStudentStats } from "./_actions/student.action";
import {
  StudentStatCards,
  StudentStats,
} from "@/components/dashboard/stat-cards";

export default function Page() {
  // applied state — the toolbar edits a draft and commits it on Search
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [search, setSearch] = useState("");

  // ------------- queries ---------------
  const { data: students, isPending } = useQuery<StudentEnrollment[]>({
    queryKey: ["page-Student", "enrollment"],
    queryFn: async () => {
      const result = await getStudents();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as StudentEnrollment[];
    },
  });

  const { data: statsData } = useQuery<StudentStats>({
    queryKey: ["page-Student", "stats"],
    queryFn: async () => {
      const result = await getStudentStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  if (isPending) {
    return <SpinnerCustom />;
  }

  const rows = students ?? [];

  return (
    <div className="w-full max-w-7xl space-y-6 my-8 mx-auto px-4 sm:px-6 lg:px-8">
      <Title title="Student Management" />
      <p className="text-muted-foreground ">
        Manage enrolled students across all classes and sections.
      </p>
      <div className=" mb-5">
        {statsData && <StudentStatCards stats={statsData} />}
      </div>

      <Card className="pb-0 gap-0">
        <CardHeader className="border-b border-border gap-0">
          {/* tools */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Filter students by class, section, group and more.
            </div>
            <div className="sm:ml-auto flex items-center gap-2 flex-wrap justify-center">
              <Link href={"/dashboard/students/add-new"}>
                <Button variant={"default"}>Add Student</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  <Download data-icon="inline-start" />
                  Export
                  <ChevronDown data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer">
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* the only student list on this page */}
        <DataTable
          columns={studentColumns}
          data={rows}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          initialColumnVisibility={HIDDEN_FILTER_COLUMNS}
          globalFilter={search}
          toolbar={(table) => (
            <>
              <StudentFilters
                students={rows}
                filters={columnFilters}
                onFiltersChange={setColumnFilters}
                search={search}
                onSearchChange={setSearch}
              />
              <div className="px-3 pt-2 text-xs text-muted-foreground">
                Showing {table.getRowModel().rows.length} of {rows.length}{" "}
                students
              </div>
            </>
          )}
        />
      </Card>
    </div>
  );
}
