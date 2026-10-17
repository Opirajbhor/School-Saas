"use client";

import type { ClassSubjectRowType } from "@/src/validation/subjects.zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormContext, useWatch } from "react-hook-form";
import { ExamConfigFormValues } from "../_schema/markInput.zod";

type ExamConfigTableProps = {
  rows: ClassSubjectRowType[];
};

export function ExamConfigTable({ rows }: ExamConfigTableProps) {
  const markTypes =
    rows[0]?.markTypes.filter((type) => type.status === "ACTIVE") ?? [];

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b">
            <th className="h-12 px-4 text-left font-medium">SL</th>
            <th className="h-12 px-4 text-left font-medium">Subject</th>

            {markTypes.map((type) => (
              <th
                key={type.id}
                className="min-w-56 px-4 py-3 text-left font-medium"
              >
                {type.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((subject, index) => (
            <tr key={subject.id} className="border-b last:border-0">
              <td className="px-4 py-3">{index + 1}</td>

              <td className="px-4 py-3 font-medium">
                {subject.subject?.name ?? "Unknown"}
              </td>

              {markTypes.map((type) => (
                <td key={type.id}>
                  <MarkInputCell subjectIndex={index} markTypeId={type.id} />
                </td>
              ))}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={markTypes.length + 2}
                className="h-24 text-center text-muted-foreground"
              >
                No subjects found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type MarkInputCellProps = {
  subjectIndex: number;
  markTypeId: string;
};

function MarkInputCell({ subjectIndex, markTypeId }: MarkInputCellProps) {
  const { register, control, setValue } =
    useFormContext<ExamConfigFormValues>();

  const baseName = `subjects.${subjectIndex}.marks.${markTypeId}` as const;

  const isEnabled = useWatch({
    control,
    name: `${baseName}.isEnabled`,
  });

  const fullMark = useWatch({
    control,
    name: `${baseName}.fullMark`,
  });

  const passMark = fullMark != null ? Math.round(fullMark * 0.33) : null;

  return (
    <div className="flex min-w-48 flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          placeholder="Full mark"
          disabled={!isEnabled}
          {...register(`${baseName}.fullMark`, {
            setValueAs: (value) => (value === "" ? null : Number(value)),
          })}
        />

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setValue(`${baseName}.isEnabled`, !isEnabled, {
              shouldDirty: true,
            })
          }
        >
          {isEnabled ? "Disable" : "Enable"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Pass mark (33%): {passMark ?? "—"}
      </p>
    </div>
  );
}
