"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { DataTableColumnHeader } from "@/components/table/tanstack/sortable-header";
import { createColumnHelper } from "@tanstack/react-table";
import { OutputExamResultType } from "../../_schema/exam.zod";
import { ResultGradeBadge } from "./result-ui";

type StudentRow = OutputExamResultType["students"][number];
type SubjectColumn = OutputExamResultType["subjects"][number];

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, StudentRow>();

// one row per student: roll, name, a column per graded subject, then the
// totals, grade and the two positions. Built per call because the subject
// columns depend on the selected class.
export const resultColumns = (subjects: SubjectColumn[]) =>
  columnHelper.columns([
    columnHelper.accessor("roll", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roll" />
      ),
      sortFn: "alphanumeric",
    }),
    columnHelper.accessor("englishName", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      filterFn: "includesString",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-foreground">
            {row.original.englishName}
          </span>
          {row.original.banglaName && (
            <span className="block text-xs text-muted-foreground">
              {row.original.banglaName}
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: "section",
      header: "Section",
      cell: ({ row }) => row.original.sectionName,
    }),

    // one column per graded subject, read out of the row's own subject list
    ...subjects.map((subject) =>
      columnHelper.display({
        id: `subject-${subject.id}`,
        header: () => (
          <div className="text-center">
            {subject.name}
            <span className="block text-xs font-normal text-muted-foreground">
              / {subject.fullMark}
            </span>
          </div>
        ),
        cell: ({ row }) => {
          const result = row.original.subjects.find(
            (item: { subjectId: string }) => item.subjectId === subject.id,
          );
          // a subject this student does not take stays blank, not zero
          if (!result) {
            return <span className="block text-center text-muted-foreground">—</span>;
          }
          return (
            <div className="text-center">
              <span className="font-medium text-foreground">
                {result.obtained}
              </span>
              <span className="mt-0.5 block">
                <ResultGradeBadge
                  grade={result.grade}
                  failed={result.failed}
                  absent={result.absent}
                />
              </span>
            </div>
          );
        },
      }),
    ),

    columnHelper.accessor("totalObtained", {
      id: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.totalObtained}
          <span className="font-normal text-muted-foreground">
            /{row.original.totalFullMark}
          </span>
        </span>
      ),
    }),
    columnHelper.accessor("GPA", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GPA" />
      ),
      cell: ({ row }) => row.original.GPA.toFixed(2),
    }),
    columnHelper.accessor("grade", {
      header: "Grade",
      cell: ({ row }) => (
        <ResultGradeBadge
          grade={row.original.grade}
          failed={!row.original.passed}
          absent={false}
        />
      ),
    }),
    columnHelper.accessor("classRank", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rank" />
      ),
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-medium text-foreground">
            {row.original.classRank}
          </span>
          <span className="block text-muted-foreground">
            section {row.original.sectionRank}
          </span>
        </div>
      ),
    }),
  ]);
