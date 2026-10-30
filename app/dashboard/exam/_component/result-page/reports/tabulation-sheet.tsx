import { OutputExamResultType } from "../../../_schema/exam.zod";
import { ReportHeader, ReportIncompleteNote } from "./report-header";
import { classTotals, studentsInSection } from "./report-utils";

// The class tabulation sheet: one row per student, one column per subject,
// then the totals, GPA, grade and both positions. Meant for landscape paper,
// so it is wider than the other reports.
export function TabulationSheet({
  sheet,
  sectionId,
}: {
  sheet: OutputExamResultType;
  sectionId?: string;
}) {
  const students = [...studentsInSection(sheet, sectionId)].sort(
    (a, b) => a.classRank - b.classRank,
  );
  const section = sectionId
    ? sheet.sections.find((item) => item.id === sectionId)?.name
    : undefined;
  const totals = classTotals(students);

  return (
    <article className="print-landscape">
      <ReportHeader
        sheet={sheet}
        title="Class Tabulation Sheet"
        subtitle={section ? `Section ${section}` : "All sections"}
      />

      {students.length === 0 ? (
        <p className="border border-black px-3 py-6 text-center text-sm">
          No students to tabulate.
        </p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-y-2 border-black text-left">
              <th className="px-1 py-1 text-center font-semibold">Rank</th>
              <th className="px-1 py-1 text-center font-semibold">Roll</th>
              <th className="px-1 py-1 font-semibold">Student</th>
              {sheet.sections.length > 1 && (
                <th className="px-1 py-1 text-center font-semibold">Sec</th>
              )}
              {sheet.subjects.map((subject) => (
                <th
                  key={subject.id}
                  className="px-1 py-1 text-center font-semibold"
                  // the subject name is vertical-ish; keep it readable
                  title={subject.name}
                >
                  <span className="block max-w-[70px] truncate">
                    {subject.name}
                  </span>
                  <span className="block font-normal">({subject.fullMark})</span>
                </th>
              ))}
              <th className="px-1 py-1 text-right font-semibold">Total</th>
              <th className="px-1 py-1 text-right font-semibold">%</th>
              <th className="px-1 py-1 text-center font-semibold">GPA</th>
              <th className="px-1 py-1 text-center font-semibold">Grade</th>
              <th className="px-1 py-1 text-center font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.enrollmentId} className="border-b border-black/30">
                <td className="px-1 py-1 text-center tabular-nums">
                  {student.sectionRank}
                </td>
                <td className="px-1 py-1 text-center tabular-nums">
                  {student.roll}
                </td>
                <td className="px-1 py-1">{student.englishName}</td>
                {sheet.sections.length > 1 && (
                  <td className="px-1 py-1 text-center">
                    {student.sectionName}
                  </td>
                )}
                {sheet.subjects.map((subject) => {
                  const cell = student.subjects.find(
                    (item) => item.subjectId === subject.id,
                  );
                  return (
                    <td
                      key={subject.id}
                      className={`px-1 py-1 text-center tabular-nums ${
                        cell?.failed ? "font-semibold" : ""
                      }`}
                    >
                      {cell
                        ? cell.absent
                          ? "AB"
                          : cell.obtained
                        : "—"}
                    </td>
                  );
                })}
                <td className="px-1 py-1 text-right tabular-nums">
                  {student.totalObtained}/{student.totalFullMark}
                </td>
                <td className="px-1 py-1 text-right tabular-nums">
                  {student.percentage.toFixed(2)}
                </td>
                <td className="px-1 py-1 text-center tabular-nums">
                  {student.GPA.toFixed(2)}
                </td>
                <td className="px-1 py-1 text-center font-semibold">
                  {student.grade}
                </td>
                <td className="px-1 py-1 text-center">
                  {student.passed ? "Pass" : "Fail"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* the same totals the rows add up to, so the sheet can be checked */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span>
          <span className="font-semibold">Students: </span>
          {totals.total}
        </span>
        <span>
          <span className="font-semibold">Passed: </span>
          {totals.passed}
        </span>
        <span>
          <span className="font-semibold">Failed: </span>
          {totals.failed}
        </span>
        <span>
          <span className="font-semibold">Average: </span>
          {totals.average.toFixed(2)}%
        </span>
        <span>
          <span className="font-semibold">Average GPA: </span>
          {totals.gpa.toFixed(2)}
        </span>
      </div>

      <ReportIncompleteNote sheet={sheet} />
    </article>
  );
}
