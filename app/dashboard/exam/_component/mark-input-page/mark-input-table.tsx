"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormInput } from "@/components/forms/form-input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputMarkInputSheetType,
  OutputMarkEntrySheetType,
} from "../../_schema/exam.zod";
import { MarkStatusBadge } from "./mark-input-ui";

// Grid of students × configured mark types. Row details come from the loaded
// sheet, the inputs from the form; both are indexed against the *unfiltered*
// row array, so search and pagination only choose which indexes render.
export function MarkInputTable({
  sheet,
  visibleIndexes,
}: {
  sheet: OutputMarkEntrySheetType;
  visibleIndexes: number[];
}) {
  const { control } = useFormContext<InputMarkInputSheetType>();
  const rows = useWatch({ control, name: "rows" });
  const markTypes = sheet.markTypes;
  // read-only when submitted for a teacher; admins and approved requests keep
  // editing rights, which the server has already decided
  const readOnly = !sheet.canEdit;

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead rowSpan={2} className="w-16 text-center">
            Roll
          </TableHead>
          <TableHead rowSpan={2} className="min-w-44">
            Student Name
          </TableHead>
          {markTypes.map((type) => (
            <TableHead key={type.id} colSpan={2} className="text-center">
              {type.name}
              <span className="font-normal text-muted-foreground">
                {" "}
                ({type.fullMark})
              </span>
            </TableHead>
          ))}
          <TableHead rowSpan={2} className="w-20 text-center">
            Total
            <span className="block text-xs font-normal text-muted-foreground">
              / {sheet.totalMarks}
            </span>
          </TableHead>
          <TableHead rowSpan={2} className="w-24 text-center">
            Status
          </TableHead>
          <TableHead rowSpan={2} className="w-20 text-center">
            Absent
          </TableHead>
        </TableRow>
        <TableRow>
          {markTypes.flatMap((type) =>
            ["Mark", "Result"].map((label) => (
              <TableHead key={`${type.id}-${label}`} className="w-24 text-center">
                {label}
              </TableHead>
            )),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleIndexes.map((index) => {
          const row = sheet.rows[index];
          const studentMarks = rows?.[index]?.marks ?? [];
          const isAbsent = Boolean(rows?.[index]?.absent);
          const total = studentMarks.reduce(
            (sum, mark) => sum + (Number(mark.mark) || 0),
            0,
          );

          return (
            <TableRow key={row.studentId}>
              <TableCell className="text-center text-muted-foreground">
                {row.roll}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {row.englishName}
                {row.banglaName && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {row.banglaName}
                  </span>
                )}
              </TableCell>
              {markTypes.flatMap((type, typeIndex) => {
                const mark = studentMarks[typeIndex];
                return [
                  <TableCell key={`${type.id}-mark`} className="text-center">
                    {isAbsent ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <FormInput
                        control={control}
                        name={`rows.${index}.marks.${typeIndex}.mark`}
                        label=""
                        type="number"
                        min={0}
                        max={type.fullMark}
                        disabled={readOnly}
                        aria-label={`${type.name} mark for ${row.englishName}`}
                        className="mx-auto w-16"
                      />
                    )}
                  </TableCell>,
                  <TableCell key={`${type.id}-result`} className="text-center">
                    <MarkStatusBadge
                      absent={isAbsent}
                      mark={mark?.mark}
                      passMark={type.passMark}
                      fullMark={type.fullMark}
                    />
                  </TableCell>,
                ];
              })}
              <TableCell className="text-center font-medium text-foreground">
                {isAbsent ? "—" : total}
              </TableCell>
              <TableCell className="text-center">
                {row.status ? (
                  <span className="text-xs text-muted-foreground">
                    {row.status === "SUBMITTED" ? "Submitted" : "Draft"}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <FormCheckbox
                  control={control}
                  name={`rows.${index}.absent`}
                  label=""
                  disabled={readOnly}
                  className="justify-center"
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {sheet.rows.length === 0 && (
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={5 + markTypes.length * 2}
              className="h-24 text-center text-muted-foreground"
            >
              No active students are enrolled in this section.
            </TableCell>
          </TableRow>
        </TableBody>
      )}
    </Table>
  );
}

// Kept separate so the parent can render it while the sheet query is in flight.
export function MarkInputTableLoading() {
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
      <Spinner />
      Loading students...
    </div>
  );
}
