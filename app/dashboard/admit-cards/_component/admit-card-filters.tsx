"use client";

import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";

/**
 * Exam → class → section pickers for the admit-card batch. They drive the URL,
 * so the page stays a server component and a printed sheet is just a link.
 */
export function AdmitCardFilters({
  exams,
  classes,
  sections,
  examId,
  classId,
  sectionId,
}: {
  exams: { label: string; value: string }[];
  classes: { label: string; value: string }[];
  sections: { label: string; value: string; classId: string }[];
  examId?: string;
  classId?: string;
  sectionId?: string;
}) {
  const router = useRouter();

  const go = (next: {
    exam?: string | null;
    class?: string | null;
    section?: string | null;
  }) => {
    const params = new URLSearchParams();
    const exam = next.exam === undefined ? examId : next.exam;
    const klass = next.class === undefined ? classId : next.class;
    const section = next.section === undefined ? sectionId : next.section;

    if (exam) params.set("exam", exam);
    if (klass) params.set("class", klass);
    if (section) params.set("section", section);

    router.push(`/dashboard/admit-cards?${params.toString()}`);
  };

  return (
    <Card className="grid gap-3 p-3 sm:grid-cols-3">
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Exam</p>
        <Combobox
          options={exams}
          value={examId ?? null}
          onValueChange={(value) =>
            // a new exam means a new class list and routine
            go({ exam: value, section: null })
          }
          placeholder="Choose an exam"
          searchPlaceholder="Search exams…"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Class</p>
        <Combobox
          options={classes}
          value={classId ?? null}
          onValueChange={(value) => go({ class: value, section: null })}
          placeholder="Choose a class"
          searchPlaceholder="Search classes…"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Section</p>
        <Combobox
          options={sections
            .filter((section) => !classId || section.classId === classId)
            .map(({ label, value }) => ({ label, value }))}
          value={sectionId ?? null}
          onValueChange={(value) => go({ section: value })}
          placeholder="All sections"
          clearLabel="All sections"
          searchPlaceholder="Search sections…"
          disabled={!classId}
        />
      </div>
    </Card>
  );
}
