"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { Teacherlist } from "@/src/validation/teacher.zod";
import { createColumnHelper } from "@tanstack/react-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditTeachers from "@/components/dashboard/teachers/edit-teachers";
import DeleteTeacher from "@/components/dashboard/teachers/delete-teacher";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Teacherlist>();

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const teacherColumns = columnHelper.columns([
  // One accessor over every searchable field, so the toolbar search matches
  // Bangla name, English name, email, phone or designation.
  columnHelper.accessor(
    (row) =>
      `${row.nameEnglish} ${row.nameBangla} ${row.email} ${row.mobile} ${row.designation}`,
    {
      id: "teacher",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Teacher" />
      ),
      filterFn: "includesString",
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              {teacher.photoUrl && (
                <AvatarImage
                  src={teacher.photoUrl}
                  alt={teacher.nameEnglish}
                />
              )}
              <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
                {getInitials(teacher.nameEnglish)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="font-medium text-foreground">{teacher.nameBangla}</p>
              <p className="text-xs text-muted-foreground">
                {teacher.nameEnglish}
              </p>
            </div>
          </div>
        );
      },
    },
  ),

  columnHelper.accessor("designation", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Designation" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.designation}
      </span>
    ),
  }),

  columnHelper.accessor("gender", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gender" />
    ),
    filterFn: "equals",
    cell: ({ row }) => (
      <span className="text-sm capitalize text-muted-foreground">
        {row.original.gender.toLowerCase()}
      </span>
    ),
  }),

  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email}</span>
    ),
  }),

  columnHelper.accessor("mobile", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {row.original.mobile}
      </span>
    ),
  }),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    filterFn: "equals",
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  }),

  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <EditTeachers user={row.original} />
        <DeleteTeacher user={row.original} />
      </div>
    ),
  }),
]);
