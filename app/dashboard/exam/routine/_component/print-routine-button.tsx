"use client";

import { useState } from "react";
import { Printer } from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";

/**
 * The print control in the page header: pick a class (or leave it on "All
 * classes") and open the printable sheet in a new tab.
 *
 * It is a real link, not a JS call, so it also works with "open in new tab" and
 * mid-click.
 */
export function PrintRoutineButton({
  examId,
  classes,
}: {
  examId: string;
  classes: { label: string; value: string }[];
}) {
  const [classId, setClassId] = useState<string | null>(null);

  const href = classId
    ? `/print/routines/${examId}?classes=${classId}`
    : `/print/routines/${examId}`;

  return (
    <div className="flex items-center gap-2">
      <Combobox
        options={classes}
        value={classId}
        onValueChange={setClassId}
        placeholder="All classes"
        clearLabel="All classes"
        searchPlaceholder="Search classes…"
        emptyMessage="No classes."
        className="w-36"
      />

      <Button size="sm" variant="outline" asChild>
        <a href={href} target="_blank" rel="noreferrer">
          <Printer />
          Print routine
        </a>
      </Button>
    </div>
  );
}
