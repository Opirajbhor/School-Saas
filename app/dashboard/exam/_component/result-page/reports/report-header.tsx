import { OutputExamResultType } from "../../../_schema/exam.zod";
import { workflowLabel } from "./report-utils";

// Shared masthead for every printed report: what document this is, which exam
// and class it covers, and whether the figures are final. Repeated on each
// report so a loose page can never be mistaken for another.
export function ReportHeader({
  sheet,
  title,
  subtitle,
}: {
  sheet: OutputExamResultType;
  title: string;
  subtitle?: string;
}) {
  const published = Boolean(sheet.fromSnapshot) ||
    sheet.exam.markWorkflow === "PUBLISHED";

  return (
    <header className="mb-4 border-b-2 border-black pb-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold uppercase tracking-wide">
            {title}
          </h1>
          <p className="text-sm">
            {sheet.exam.name} — {sheet.class.name}
            {subtitle ? ` — ${subtitle}` : ""}
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold uppercase">
            {published ? "Published result" : "Draft result"}
          </p>
          <p>{workflowLabel(sheet)}</p>
          <p>Printed {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* a draft must never be mistaken for a final document */}
      {!published && (
        <p className="mt-2 border border-black px-2 py-1 text-xs font-semibold uppercase">
          Draft — not published. Figures may change.
        </p>
      )}
    </header>
  );
}

// The footer note listing sections × subjects still missing marks, so a printed
// document never hides the fact that some marks were never entered.
export function ReportIncompleteNote({
  sheet,
}: {
  sheet: OutputExamResultType;
}) {
  if (sheet.incomplete.length === 0) return null;

  const total = sheet.incomplete.reduce((sum, unit) => sum + unit.missing, 0);

  return (
    <p className="mt-4 border border-black px-2 py-1 text-xs">
      <span className="font-semibold">Incomplete marks: </span>
      {total} missing in{" "}
      {sheet.incomplete
        .map((unit) => `${unit.subjectName} (${unit.sectionName})`)
        .join(", ")}
      . Positions and totals cover only the marks entered so far.
    </p>
  );
}
