"use client";

import { DataTable } from "@/components/table/tanstack/data-table";
import { DefaultMarkCongfigColumn } from "./default-mark-config-column";
import type { OutputDefaultMarkTypes } from "../_schema/markInput.zod";

export function MarkConfigTable({ data }: { data: OutputDefaultMarkTypes[] }) {
  const markTypeNames = Array.from(
    new Set(data.flatMap((s) => s.markTemplates.map((t) => t.markType.name))),
  );

  const columns = DefaultMarkCongfigColumn(markTypeNames);

  return <DataTable columns={columns} data={data} />;
}
