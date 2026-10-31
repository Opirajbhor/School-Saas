"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mars, Search, UserCheck, Users, Venus } from "lucide-react";

import { Teacherlist, TeacherStatsResponse } from "@/src/validation/teacher.zod";
import AddTeacher from "@/components/dashboard/teachers/add-teacher";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { DataTable } from "@/components/table/tanstack/data-table";
import { teacherColumns } from "./_table/columns";
import { useQuery } from "@tanstack/react-query";
import { getTeacher, getTeacherStats } from "./_actions/teacher.action";

export default function Teacherpage() {
  const [search, setSearch] = useState("");

  // ------------- query fn ---------------
  const { data: teachers = [], isPending } = useQuery<Teacherlist[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const result = await getTeacher();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as Teacherlist[];
    },
  });

  const { data: stats, isPending: isLoadingStats } =
    useQuery<TeacherStatsResponse>({
      queryKey: ["statlist"],
      queryFn: async () => {
        const result = await getTeacherStats();
        if (!result.success) {
          throw new Error(result.error ?? "Failed to load teacher stats");
        }
        return result as TeacherStatsResponse;
      },
    });

  if (isPending || isLoadingStats) {
    return <PageSkeleton />;
  }

  const rows = teachers ?? [];
  const data = stats?.data;
  const inactive = (data?.totalTeachers ?? 0) - (data?.activeTeachers ?? 0);

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Teachers"
        subtitle={
          data
            ? `${metricValue(data.totalTeachers)} staff · ${data.activeTeachers} active`
            : "Teaching staff and contact details."
        }
        actions={<AddTeacher />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Total teachers"
          value={metricValue(data?.totalTeachers)}
          icon={Users}
          segments={
            data && data.totalTeachers > 0
              ? [
                  { value: data.activeTeachers, className: "bg-foreground" },
                  { value: inactive, className: "bg-foreground/30" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              {data
                ? `${data.activeTeachers} active · ${inactive} inactive`
                : "No staff yet"}
            </p>
          }
        />

        <Metric
          label="Active"
          value={metricValue(data?.activeTeachers)}
          icon={UserCheck}
          footer={
            <p className="text-xs text-muted-foreground">currently employed</p>
          }
        />

        <Metric
          label="Male"
          value={metricValue(data?.maleTeachers)}
          icon={Mars}
          footer={<p className="text-xs text-muted-foreground">of all staff</p>}
        />

        <Metric
          label="Female"
          value={metricValue(data?.femaleTeachers)}
          icon={Venus}
          footer={<p className="text-xs text-muted-foreground">of all staff</p>}
        />
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">All teachers</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {rows.length}
          </span>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            Search by name, email, phone or designation
          </p>
        </div>

        <DataTable
          columns={teacherColumns}
          data={rows}
          globalFilter={search}
          toolbar={() => (
            <div className="px-4 py-3">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search teachers..."
                  className="pl-9"
                />
              </div>
            </div>
          )}
        />
      </Card>
    </main>
  );
}
