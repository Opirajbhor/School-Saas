"use client";

import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { StudentEnrollment } from "@/src/validation/student.zod";
import { createColumnHelper } from "@tanstack/react-table";

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, StudentEnrollment>();

export const columns = columnHelper.columns([
  columnHelper.accessor("roll", {
    header: "Roll",
  }),
  columnHelper.accessor("student.englishName", {
    header: "Name",
  }),
  columnHelper.accessor("class.name", {
    header: "Class",
  }),
]);
