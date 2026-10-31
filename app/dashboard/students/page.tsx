"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutGrid, Plus, UserCheck, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import { StudentEnrollment } from "@/src/validation/student.zod";
import type { ColumnFiltersState } from "@tanstack/react-table";

import Link from "next/link";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { DataTable } from "@/components/table/tanstack/data-table";
import { studentColumns } from "./_table/columns";
import {
  HIDDEN_FILTER_COLUMNS,
  StudentFilters,
} from "./_table/student-filters";
import { useQuery } from "@tanstack/react-query";
import { getStudents, getStudentStats } from "./_actions/student.action";
import type { StudentStats } from "@/components/dashboard/stat-cards";

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

  const { data: stats } = useQuery<StudentStats>({
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
    return <PageSkeleton />;
  }

  const rows = students ?? [];

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Students"
        subtitle={
          stats
            ? `${metricValue(stats.total)} enrolled · ${stats.classes} classes · ${stats.sections} sections`
            : "Enrolment across every class and section."
        }
        actions={
          <Button size="sm" asChild>
            <Link href="/dashboard/students/add-new">
              <Plus />
              Add student
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Total students"
          value={metricValue(stats?.total)}
          icon={Users}
          segments={
            stats && stats.total > 0
              ? [
                  { value: stats.active, className: "bg-foreground" },
                  { value: stats.inactive, className: "bg-foreground/30" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              {stats
                ? `${stats.active} active · ${stats.inactive} inactive`
                : "No enrolments yet"}
            </p>
          }
        />

        <Metric
          label="Active"
          value={metricValue(stats?.active)}
          icon={UserCheck}
          footer={
            <p className="text-xs text-muted-foreground">currently enrolled</p>
          }
        />

        <Metric
          label="Inactive"
          value={metricValue(stats?.inactive)}
          icon={UserMinus}
          footer={
            <p className="text-xs text-muted-foreground">no longer enrolled</p>
          }
        />

        <Metric
          label="Classes"
          value={metricValue(stats?.classes)}
          icon={LayoutGrid}
          footer={
            <p className="text-xs text-muted-foreground">
              {metricValue(stats?.sections)} sections
            </p>
          }
        />
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            All students
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {rows.length}
          </span>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            Filter by class, section, group, gender or status
          </p>
        </div>

        <DataTable
          columns={studentColumns}
          data={rows}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          initialColumnVisibility={HIDDEN_FILTER_COLUMNS}
          globalFilter={search}
          toolbar={() => (
            <StudentFilters
              students={rows}
              filters={columnFilters}
              onFiltersChange={setColumnFilters}
              search={search}
              onSearchChange={setSearch}
            />
          )}
        />
      </Card>
    </main>
  );
}
