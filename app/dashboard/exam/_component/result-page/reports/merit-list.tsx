import { OutputExamResultType } from "../../../_schema/exam.zod";
import { ReportHeader, ReportIncompleteNote } from "./report-header";
import { buildMeritList } from "./report-utils";

// The merit list: students in order of position, best first. Filtered to one
// section it re-ranks 1..n within that section, so a section list stands on its
// own instead of showing class ranks with gaps in them.
export function MeritListReport({
  sheet,
  sectionId,
}: {
  sheet: OutputExamResultType;
  sectionId?: string;
}) {
  const rows = buildMeritList(sheet, sectionId);
  const section = sectionId
    ? sheet.sections.find((item) => item.id === sectionId)?.name
    : undefined;

  return (
    <article>
      <ReportHeader
        sheet={sheet}
        title="Merit List"
        subtitle={section ? `Section ${section}` : "All sections"}
      />

      {rows.length === 0 ? (
        <p className="border border-black px-3 py-6 text-center text-sm">
          No students to rank.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y-2 border-black text-left">
              <th className="px-1 py-1 text-center font-semibold">Position</th>
              <th className="px-1 py-1 text-center font-semibold">Roll</th>
              <th className="px-1 py-1 font-semibold">Student</th>
              {sheet.sections.length > 1 && (
                <>
                  <th className="px-1 py-1 text-center font-semibold">
                    Section
                  </th>
                  <th className="px-1 py-1 text-center font-semibold">
                    Sec. position
                  </th>
                </>
              )}
              <th className="px-1 py-1 text-right font-semibold">Total</th>
              <th className="px-1 py-1 text-right font-semibold">%</th>
              <th className="px-1 py-1 text-center font-semibold">GPA</th>
              <th className="px-1 py-1 text-center font-semibold">Grade</th>
              <th className="px-1 py-1 text-center font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.enrollmentId} className="border-b border-black/30">
                <td className="px-1 py-1 text-center font-semibold tabular-nums">
                  {row.classRank}
                </td>
                <td className="px-1 py-1 text-center tabular-nums">
                  {row.roll}
                </td>
                <td className="px-1 py-1">
                  {row.englishName}
                  {row.banglaName && (
                    <span className="ml-1 text-xs">({row.banglaName})</span>
                  )}
                </td>
                {sheet.sections.length > 1 && (
                  <>
                    <td className="px-1 py-1 text-center">
                      {row.sectionName}
                    </td>
                    <td className="px-1 py-1 text-center tabular-nums">
                      {row.sectionRank}
                    </td>
                  </>
                )}
                <td className="px-1 py-1 text-right tabular-nums">
                  {row.totalObtained}/{row.totalFullMark}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {row.percentage.toFixed(2)}
                </td>
                <td className="px-1 py-1 text-center tabular-nums">
                  {row.GPA.toFixed(2)}
                </td>
                <td className="px-1 py-1 text-center font-semibold">
                  {row.grade}
                </td>
                <td className="px-1 py-1 text-center">
                  {row.passed ? "Pass" : "Fail"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ReportIncompleteNote sheet={sheet} />
    </article>
  );
}
