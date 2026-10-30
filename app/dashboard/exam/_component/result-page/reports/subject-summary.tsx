import { OutputExamResultType } from "../../../_schema/exam.zod";
import { ReportHeader, ReportIncompleteNote } from "./report-header";
import { classTotals, studentsInSection, summariseSubjects } from "./report-utils";

// Subject-wise summary: how each subject went across the class — how many sat
// it, passed, failed, the spread of marks and the grade tally. Useful for
// spotting a subject that is failing far more students than the rest.
export function SubjectSummaryReport({
  sheet,
  sectionId,
}: {
  sheet: OutputExamResultType;
  sectionId?: string;
}) {
  const scoped = studentsInSection(sheet, sectionId);
  const section = sectionId
    ? sheet.sections.find((item) => item.id === sectionId)?.name
    : undefined;
  const totals = classTotals(scoped);

  // summaries are computed over the sheet, so narrow it to the requested
  // section first rather than counting students who are not in it
  const scopedSheet: OutputExamResultType = { ...sheet, students: scoped };
  const summaries = summariseSubjects(scopedSheet);

  return (
    <article>
      <ReportHeader
        sheet={sheet}
        title="Subject-wise Result Summary"
        subtitle={section ? `Section ${section}` : "All sections"}
      />

      {summaries.length === 0 ? (
        <p className="border border-black px-3 py-6 text-center text-sm">
          No subjects were graded for this class.
        </p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-y-2 border-black text-left">
              <th className="px-1 py-1 font-semibold">Subject</th>
              <th className="px-1 py-1 text-right font-semibold">Full</th>
              <th className="px-1 py-1 text-right font-semibold">Sat</th>
              <th className="px-1 py-1 text-right font-semibold">Passed</th>
              <th className="px-1 py-1 text-right font-semibold">Failed</th>
              <th className="px-1 py-1 text-right font-semibold">Absent</th>
              <th className="px-1 py-1 text-right font-semibold">Pass %</th>
              <th className="px-1 py-1 text-right font-semibold">Average</th>
              <th className="px-1 py-1 text-right font-semibold">Highest</th>
              <th className="px-1 py-1 text-right font-semibold">Lowest</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.subjectId} className="border-b border-black/30">
                <td className="px-1 py-1 font-medium">{summary.name}</td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.fullMark}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.appeared}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.passed}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.failed}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.absent}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.passRate.toFixed(2)}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.average.toFixed(2)}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.highest}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {summary.lowest}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* grade spread per subject, so the shape of each result is visible */}
      {summaries.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-1 text-sm font-semibold uppercase">
            Grade distribution
          </h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-y border-black text-left">
                <th className="px-1 py-1 font-semibold">Subject</th>
                {/* union of the grades actually awarded, in the sheet's order */}
                {gradeColumns(summaries).map((grade) => (
                  <th
                    key={grade}
                    className="px-1 py-1 text-center font-semibold"
                  >
                    {grade}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary) => (
                <tr key={summary.subjectId} className="border-b border-black/30">
                  <td className="px-1 py-1 font-medium">{summary.name}</td>
                  {gradeColumns(summaries).map((grade) => {
                    const found = summary.gradeCounts.find(
                      (item) => item.grade === grade,
                    );
                    return (
                      <td
                        key={grade}
                        className="px-1 py-1 text-center tabular-nums"
                      >
                        {found ? found.count : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span>
          <span className="font-semibold">Students: </span>
          {totals.total}
        </span>
        <span>
          <span className="font-semibold">Overall pass rate: </span>
          {totals.total === 0
            ? "0.00"
            : ((totals.passed / totals.total) * 100).toFixed(2)}
          %
        </span>
      </div>

      <ReportIncompleteNote sheet={sheet} />
    </article>
  );
}

// every grade that appears in any subject, ordered as the sheet orders them
function gradeColumns(summaries: ReturnType<typeof summariseSubjects>) {
  const seen = new Set<string>();
  for (const summary of summaries) {
    for (const item of summary.gradeCounts) seen.add(item.grade);
  }
  return [...seen];
}
