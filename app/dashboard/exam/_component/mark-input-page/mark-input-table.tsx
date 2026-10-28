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

type SheetRow = OutputMarkEntrySheetType["rows"][number];

// rows render their details from the loaded sheet and their inputs from the
// form — both are indexed the same way
export function MarkInputTable({
  sheet,
  isFetching,
  filteredIndexes,
}: {
  sheet: OutputMarkEntrySheetType | undefined;
  isFetching: boolean;
  filteredIndexes: { row: SheetRow; index: number }[];
}) {
  const { control } = useFormContext<InputMarkInputSheetType>();
  const rows = useWatch({ control, name: "rows" });
  const markTypes = sheet?.markTypes ?? [];

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Spinner />
        Loading students...
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead rowSpan={2} className="w-16 text-center">
            Roll No.
          </TableHead>
          <TableHead rowSpan={2} className="min-w-40">
            Student Name
          </TableHead>
          {markTypes.map((type) => (
            <TableHead key={type.id} colSpan={2} className="text-center">
              {type.name} ({type.fullMark})
            </TableHead>
          ))}
          <TableHead rowSpan={2} className="w-20 text-center">
            Total{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {sheet?.totalMarks ?? 0}
            </span>
          </TableHead>
          <TableHead rowSpan={2} className="min-w-32">
            Remarks
          </TableHead>
          <TableHead rowSpan={2} className="w-24 text-center">
            Action
          </TableHead>
        </TableRow>
        <TableRow>
          {markTypes.flatMap((type) =>
            ["Marks", "Status"].map((label) => (
              <TableHead
                key={`${type.id}-${label}`}
                className="w-24 text-center"
              >
                {label}
              </TableHead>
            )),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredIndexes.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5 + markTypes.length * 2}
              className="h-24 text-center text-muted-foreground"
            >
              {sheet
                ? sheet.rows.length === 0
                  ? "No active students enrolled in this section."
                  : "No students match your search."
                : "Select an exam, class, section and subject to load students."}
            </TableCell>
          </TableRow>
        ) : (
          filteredIndexes.map(({ row, index }) => {
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
                    <TableCell key={`${type.id}-marks`} className="text-center">
                      {isAbsent ? (
                        <span className="text-muted-foreground">N/A</span>
                      ) : (
                        <FormInput
                          control={control}
                          name={`rows.${index}.marks.${typeIndex}.mark`}
                          label=""
                          type="number"
                          min={0}
                          max={type.fullMark}
                          aria-label={`${type.name} marks for ${row.englishName}`}
                          className="mx-auto w-16"
                        />
                      )}
                    </TableCell>,
                    <TableCell
                      key={`${type.id}-status`}
                      className="text-center"
                    >
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
                <TableCell className="text-xs text-muted-foreground">
                  {isAbsent ? "Absent" : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <FormCheckbox
                    control={control}
                    name={`rows.${index}.absent`}
                    label="Absent"
                  />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
