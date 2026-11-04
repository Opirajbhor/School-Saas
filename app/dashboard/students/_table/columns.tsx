"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StudentEnrollment } from "@/src/validation/student.zod";
import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { PencilSimple as Pen, GraduationCap as IdCard, Eye } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusPill } from "@/components/dashboard/status-pill";
import StatusToggleModal from "@/components/modal/status-modal";
import { ToggleStudentStatus } from "../_actions/student.action";
import { formatDate } from "@/src/lib/date";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, StudentEnrollment>();

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
      const initials = student.englishName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 shrink-0">
            {student.photoUrl ? (
              <AvatarImage src={student.photoUrl} alt={student.englishName} />
            ) : null}
            <AvatarFallback className="text-[10px] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {student.englishName}
            </p>
            {student.banglaName && (
              <p className="truncate text-xs text-muted-foreground">
                {student.banglaName}
              </p>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {student.fatherName ?? "—"} · {student.motherName ?? "—"}
            </p>
          </div>
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
    cell: ({ row }) => <StatusPill status={row.original.status} />,
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
      <Button size="sm" variant="outline" asChild>
        <Link
          href={`/print/students/${item.student.id}/id-card`}
          aria-label="Print ID card"
        >
          <IdCard />
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
