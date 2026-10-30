import Link from "next/link";
import { OutputExamResultType } from "../../../_schema/exam.zod";
import { ReportHeader, ReportIncompleteNote } from "./report-header";
import { findStudent, studentsInSection } from "./report-utils";

// One student's report card. When no student is selected every card in the
// class is printed, one per page, which is how a full set is handed out.
export function ReportCard({
  sheet,
  enrollmentId,
}: {
  sheet: OutputExamResultType;
  enrollmentId?: string;
}) {
  if (enrollmentId) {
    const student = findStudent(sheet, enrollmentId);
    if (!student) {
      return (
        <p className="border border-black px-3 py-6 text-center text-sm">
          That student is not in this class for this exam.
        </p>
      );
    }
    return <OneCard sheet={sheet} enrollmentId={enrollmentId} />;
  }

  if (sheet.students.length === 0) {
    return (
      <p className="border border-black px-3 py-6 text-center text-sm">
        No students are enrolled in this class.
      </p>
    );
  }

  return (
    <>
      {sheet.students.map((student, index) => (
        <div
          key={student.enrollmentId}
          // every card starts a fresh sheet, except the first
          className={index === 0 ? "" : "break-before-page print:break-before-page"}
        >
          <OneCard sheet={sheet} enrollmentId={student.enrollmentId} />
        </div>
      ))}
    </>
  );
}

function OneCard({
  sheet,
  enrollmentId,
}: {
  sheet: OutputExamResultType;
  enrollmentId: string;
}) {
  const student = findStudent(sheet, enrollmentId)!;

  return (
    <article className="mb-8 border border-black p-4 last:mb-0">
      <ReportHeader
        sheet={sheet}
        title="Student Report Card"
        subtitle={`Section ${student.sectionName}`}
      />

      {/* who the card is for */}
      <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Field label="Name" value={student.englishName} />
        <Field label="Roll" value={student.roll} />
        {student.banglaName && (
          <Field label="নাম" value={student.banglaName} />
        )}
        <Field label="Section" value={student.sectionName} />
        <Field label="Class" value={sheet.class.name} />
        <Field label="Exam" value={sheet.exam.name} />
      </div>

      {/* marks, one row per subject */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-black text-left">
            <Th>Subject</Th>
            <Th className="text-right">Full</Th>
            <Th className="text-right">Obtained</Th>
            <Th className="text-right">%</Th>
            <Th className="text-center">Grade</Th>
            <Th className="text-right">GPA</Th>
          </tr>
        </thead>
        <tbody>
          {student.subjects.map((subject) => (
            <tr key={subject.subjectId} className="border-b border-black/30">
              <Td>
                {subject.name}
                {subject.failed && !subject.absent && (
                  <span className="ml-1 text-xs font-semibold">(failed)</span>
                )}
              </Td>
              <Td className="text-right tabular-nums">{subject.fullMark}</Td>
              <Td className="text-right tabular-nums">
                {subject.absent ? "AB" : subject.obtained}
              </Td>
              <Td className="text-right tabular-nums">
                {subject.absent ? "—" : subject.percentage.toFixed(2)}
              </Td>
              <Td className="text-center font-semibold">
                {subject.absent && subject.grade === "F"
                  ? "AB"
                  : subject.grade}
              </Td>
              <Td className="text-right tabular-nums">
                {subject.absent ? "—" : subject.GPA.toFixed(2)}
              </Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-semibold">
            <Td>Total</Td>
            <Td className="text-right tabular-nums">{student.totalFullMark}</Td>
            <Td className="text-right tabular-nums">{student.totalObtained}</Td>
            <Td className="text-right tabular-nums">
              {student.percentage.toFixed(2)}
            </Td>
            <Td className="text-center">{student.grade}</Td>
            <Td className="text-right tabular-nums">
              {student.GPA.toFixed(2)}
            </Td>
          </tr>
        </tfoot>
      </table>

      {/* outcome and positions */}
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Field label="Result" value={student.passed ? "PASSED" : "FAILED"} />
        <Field label="GPA" value={student.GPA.toFixed(2)} />
        <Field label="Grade" value={student.grade} />
        <Field
          label="Position in section"
          value={String(student.sectionRank)}
        />
        <Field label="Position in class" value={String(student.classRank)} />
        <Field
          label="Total students"
          value={String(studentsInSection(sheet).length)}
        />
      </div>

      {student.failedSubjects.length > 0 && (
        <p className="mt-2 text-sm">
          <span className="font-semibold">Failed in: </span>
          {student.failedSubjects.join(", ")}
        </p>
      )}

      {/* how to get back to this student's live card */}
      <p className="mt-4 text-xs print:hidden">
        <Link
          className="underline"
          href={`/dashboard/results?student=${student.enrollmentId}`}
        >
          Open in the results page
        </Link>
      </p>

      <div className="mt-6 flex justify-between text-xs">
        <span>_____________________</span>
        <span>_____________________</span>
      </div>
      <div className="mt-1 flex justify-between text-xs">
        <span>Class Teacher</span>
        <span>Principal</span>
      </div>

      <ReportIncompleteNote sheet={sheet} />
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium">{label}: </span>
      <span>{value}</span>
    </p>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-1 py-1 font-semibold ${className}`}>{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-1 py-1 ${className}`}>{children}</td>;
}
