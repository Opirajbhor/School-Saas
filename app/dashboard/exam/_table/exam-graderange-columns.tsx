"use client";
import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { OutputExamGradeRangeType } from "../_schema/exam.zod";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<
  DataTableFeatures,
  OutputExamGradeRangeType
>();

export const ExamGradeRangeColumn = columnHelper.columns([
  columnHelper.display({
    id: "serial",
    header: "SL",
    cell: ({ row }) => row.index + 1,
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("minMark", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Minimum Mark" />
    ),
  }),
  columnHelper.accessor("maxMark", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Maximum Mark" />
    ),
  }),
  columnHelper.accessor("GPA", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GPA" />
    ),
  }),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  }),
]);
