"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StudentEnrollment } from "@/src/validation/student.zod";
import { createColumnHelper } from "@tanstack/react-table";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { Eye, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusToggleModal from "@/components/modal/status-modal";
import { ToggleStudentStatus } from "../_actions/student.action";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, StudentEnrollment>();

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

// Every field a student row carries, replacing the hand-rolled table this page
// used to render underneath the DataTable.
export const studentColumns = columnHelper.columns([
  columnHelper.accessor("roll", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Roll" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("student.englishName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => {
      const { student } = row.original;
      return (
        <div>
          <p className="font-medium text-foreground">{student.englishName}</p>
          {student.banglaName && (
            <p className="text-xs text-muted-foreground">
              {student.banglaName}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {student.fatherName ?? "—"} · {student.motherName ?? "—"}
          </p>
        </div>
      );
    },
  }),
  columnHelper.accessor("student.studentId", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student ID" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("class.name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Class" />
    ),
    filterFn: "includesString",
    cell: ({ row }) => (
      <div>
        <p>{row.original.class?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.section?.name ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.original.group?.name ?? "—"}
        </p>
      </div>
    ),
  }),
  columnHelper.display({
    id: "details",
    header: "Details",
    cell: ({ row }) => {
      const { student } = row.original;
      return (
        <div className="text-xs">
          <p>
            {student.religion ?? "—"} · {student.gender ?? "—"}
          </p>
          <p className="text-muted-foreground">
            DOB {formatDate(student.dateOfBirth)}
          </p>
          <p className="text-muted-foreground">{student.phone ?? "—"}</p>
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell item={row.original} />,
  }),

  // ---- filter-only columns ----
  // These exist so the toolbar has something to filter on. Their values are
  // already visible inside the cells above, so they start hidden; see
  // `columnVisibility` in student-filters.tsx.
  columnHelper.accessor("classId", {
    id: "classId",
    header: "Class",
    filterFn: "equals",
  }),
  columnHelper.accessor("sectionId", {
    id: "sectionId",
    header: "Section",
    filterFn: "equals",
  }),
  columnHelper.accessor((row) => row.group?.id ?? "", {
    id: "groupId",
    header: "Group",
    filterFn: "equals",
  }),
  columnHelper.accessor((row) => row.student.gender ?? "", {
    id: "gender",
    header: "Gender",
    filterFn: "equals",
  }),
  columnHelper.accessor((row) => row.student.religion ?? "", {
    id: "religion",
    header: "Religion",
    filterFn: "equals",
  }),
]);

/** Ids of the filter-only columns, so callers can hide them. */
export const filterOnlyColumnIds = [
  "classId",
  "sectionId",
  "groupId",
  "gender",
  "religion",
];

export function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-xs font-medium",
        status === "ACTIVE"
          ? "bg-primary text-primary-foreground"
          : "bg-foreground text-background",
      )}
    >
      {status}
    </span>
  );
}

function ActionsCell({ item }: { item: StudentEnrollment }) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" asChild>
        <Link href={`/dashboard/students/${item.id}`} aria-label="View student">
          <Eye />
        </Link>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <Link
          href={`/dashboard/students/${item.id}/edit`}
          aria-label="Edit student"
        >
          <Pen />
        </Link>
      </Button>
      <StatusToggleModal
        id={item.id}
        onDelete={ToggleStudentStatus}
        title="Change Student Status"
        description="Enrolled and inactive students are listed separately."
      />
    </div>
  );
}
