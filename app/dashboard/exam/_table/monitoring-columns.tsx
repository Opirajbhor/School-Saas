"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { createColumnHelper } from "@tanstack/react-table";
import { MonitoringUnitType } from "../_schema/exam.zod";
import {
  CompletionBadge,
  OpenSubjectLink,
  ProgressBar,
} from "../_component/exam-overview/monitoring-ui";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, MonitoringUnitType>();

// subject-by-subject monitoring rows for one exam.
// built per exam because the detail link needs the exam id.
export const monitoringUnitColumns = (examId: string) =>
  columnHelper.columns([
  columnHelper.accessor("className", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Class" />
    ),
    filterFn: "includesString",
  }),
  columnHelper.accessor("sectionName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
  }),
  columnHelper.accessor("subjectName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
  }),
  columnHelper.display({
    id: "teacher",
    header: "Teacher",
    cell: ({ row }) =>
      row.original.teacher ? (
        row.original.teacher.nameEnglish
      ) : (
        <span className="text-muted-foreground">Not assigned</span>
      ),
  }),
  columnHelper.accessor("eligibleStudents", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Students" />
    ),
  }),
  columnHelper.display({
    id: "entered",
    header: "Entered",
    cell: ({ row }) =>
      row.original.configured ? (
        <span>
          {row.original.enteredMarks}
          <span className="text-muted-foreground">
            /{row.original.requiredMarks}
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground">Not configured</span>
      ),
  }),
  columnHelper.accessor("missingMarks", {
    header: "Missing",
    cell: ({ getValue }) => {
      const missing = getValue<number>();
      return missing > 0 ? (
        <span className="font-medium text-destructive">{missing}</span>
      ) : (
        <span className="text-muted-foreground">0</span>
      );
    },
  }),
  columnHelper.display({
    id: "completion",
    header: "Progress",
    cell: ({ row }) => (
      <ProgressBar
        value={row.original.completion}
        className="w-24"
        muted={!row.original.configured}
      />
    ),
  }),
  columnHelper.display({
    id: "submission",
    header: "Submission",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <CompletionBadge status={row.original.status} />
        {row.original.pendingRequests > 0 && (
          <span className="text-[11px] text-muted-foreground">· pending</span>
        )}
      </div>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <OpenSubjectLink
        examId={examId}
        classId={row.original.classId}
        sectionId={row.original.sectionId}
        subjectId={row.original.subjectId}
      />
    ),
  }),
]);
