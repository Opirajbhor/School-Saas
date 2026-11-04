import {
  AdmitCardBatch,
  AdmitCardStudent,
} from "../_actions/admit-card.action";
import { formatDateCompact } from "@/src/lib/date";

const prettyDate = (iso: string) => formatDateCompact(iso);

const initials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/**
 * A section-filtered sheet can just say "3"; a sheet covering every section has
 * to say "A-3", or two students with roll 3 are indistinguishable.
 */
const rollLabel = (student: AdmitCardStudent, sectionOnly: boolean) =>
  sectionOnly ? student.roll : `${student.sectionName}-${student.roll}`;

function SheetHeader({ data }: { data: AdmitCardBatch }) {
  const { institute, exam, klass, section } = data;

  return (
    <header className="flex items-center gap-3 border-b border-neutral-500 pb-1.5">
      {institute.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={institute.logo}
          alt=""
          className="size-9 shrink-0 object-contain"
        />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded bg-neutral-100 text-[8px] font-semibold text-neutral-500">
          {initials(institute.nameEnglish)}
        </div>
      )}

      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-[11px] leading-tight font-bold">
          {institute.nameBangla || institute.nameEnglish}
        </p>
        <p className="truncate text-[8.5px] leading-tight text-neutral-600">
          {[institute.upazila, institute.district].filter(Boolean).join(", ")}
          {institute.eiin ? ` · EIIN ${institute.eiin}` : ""}
        </p>
        <p className="text-[8.5px] font-semibold tracking-wide uppercase">
          Attendance sheet — {exam.name}
          {exam.sessionYear ? ` ${exam.sessionYear}` : ""}
        </p>
      </div>

      <p className="shrink-0 text-right text-[8px] text-neutral-600">
        {klass.name}
        <br />
        {section ? section.name : "all sections"}
      </p>
    </header>
  );
}

function SheetFooter({ data }: { data: AdmitCardBatch }) {
  return (
    <footer className="mt-auto flex items-end justify-between gap-8 pt-2">
      <div className="text-center">
        <div className="h-[6mm] w-[32mm]" />
        <div className="w-[32mm] border-t border-neutral-500 pt-0.5 text-[8px]">
          Invigilator
        </div>
      </div>

      <div className="text-center">
        {data.institute.signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.institute.signature}
            alt=""
            className="mx-auto h-[7mm] w-auto max-w-[32mm] object-contain"
          />
        ) : (
          <div className="h-[6mm] w-[32mm]" />
        )}
        <div className="w-[32mm] border-t border-neutral-500 pt-0.5 text-[8px]">
          Head master
        </div>
      </div>
    </footer>
  );
}

/**
 * The register: every student on one sheet, one column per paper, cells left
 * blank so they can be ticked or signed in the hall. This is the compact view.
 */
export function AttendanceRegister({ data }: { data: AdmitCardBatch }) {
  const { routine, students } = data;

  return (
    <section className="attendance-page flex min-h-[240mm] flex-col border border-neutral-500 p-4 text-black">
      <SheetHeader data={data} />

      <table className="mt-2 w-full border-collapse text-[8.5px]">
        <thead>
          <tr className="bg-neutral-100">
            <th className="w-7 border border-neutral-400 px-1 py-1 text-center font-semibold">
              #
            </th>
            <th className="w-9 border border-neutral-400 px-1 py-1 text-center font-semibold">
              Photo
            </th>
            <th className="w-12 border border-neutral-400 px-1 py-1 font-semibold">
              {data.section ? "Roll" : "Sec-Roll"}
            </th>
            <th className="border border-neutral-400 px-1 py-1 text-left font-semibold">
              Student
            </th>
            {routine.map((paper, index) => (
              <th
                key={`${paper.examDate}-${paper.subjectName}-${index}`}
                className="border border-neutral-400 px-1 py-0.5 text-center align-bottom font-semibold"
              >
                <span className="block text-[7.5px] font-normal text-neutral-600">
                  {prettyDate(paper.examDate)}
                </span>
                <span className="block max-w-[22mm] leading-tight">
                  {paper.subjectName}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.enrollmentId} className="break-inside-avoid">
              <td className="border border-neutral-300 px-1 py-1 text-center tabular-nums">
                {index + 1}
              </td>
              <td className="border border-neutral-300 px-1 py-1">
                {student.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.photoUrl}
                    alt=""
                    className="mx-auto h-[7mm] w-[6mm] object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-[7mm] w-[6mm] items-center justify-center bg-neutral-100 text-[6.5px] font-semibold text-neutral-500">
                    {initials(student.englishName)}
                  </div>
                )}
              </td>
              <td className="border border-neutral-300 px-1 py-1 text-center text-[9px] font-medium tabular-nums">
                {rollLabel(student, data.section !== null)}
              </td>
              <td className="border border-neutral-300 px-1 py-1">
                {student.englishName}
              </td>
              {routine.map((paper, i) => (
                <td
                  key={`${student.enrollmentId}-${paper.examDate}-${i}`}
                  className="border border-neutral-300"
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-1.5 text-[7.5px] text-neutral-600">
        Tick the paper sat, or take the student&apos;s signature in the cell.
      </p>

      <SheetFooter data={data} />
    </section>
  );
}

/**
 * One student's own sheet: used for the 2-per-page and full-page layouts, where
 * there is room for a photo and a signature line against every paper.
 */
export function AttendanceStudentBlock({
  data,
  student,
  single = false,
}: {
  data: AdmitCardBatch;
  student: AdmitCardStudent;
  single?: boolean;
}) {
  const { routine } = data;

  return (
    <section
      className={
        single
          ? "attendance-page flex min-h-[250mm] flex-col border border-neutral-500 p-5 text-black"
          : "flex h-[130mm] flex-col border border-neutral-500 p-3 text-black"
      }
    >
      <SheetHeader data={data} />

      <div className={single ? "mt-4 flex gap-5" : "mt-2 flex gap-3"}>
        {student.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.photoUrl}
            alt={student.englishName}
            className={
              single
                ? "h-[40mm] w-[32mm] shrink-0 border border-neutral-400 object-cover"
                : "h-[22mm] w-[17mm] shrink-0 border border-neutral-400 object-cover"
            }
          />
        ) : (
          <div
            className={
              single
                ? "flex h-[40mm] w-[32mm] shrink-0 items-center justify-center border border-neutral-400 bg-neutral-100 text-[10px] font-semibold text-neutral-500"
                : "flex h-[22mm] w-[17mm] shrink-0 items-center justify-center border border-neutral-400 bg-neutral-100 text-[8px] font-semibold text-neutral-500"
            }
          >
            {initials(student.englishName)}
          </div>
        )}

        <div className={single ? "space-y-1 text-[10px]" : "space-y-0.5 text-[8.5px]"}>
          <p className="text-[11px] font-semibold">{student.englishName}</p>
          <p className="text-neutral-600">{student.banglaName ?? ""}</p>
          <p>
            <span className="text-neutral-600">Roll: </span>
            <span className="font-medium tabular-nums">
              {rollLabel(student, data.section !== null)}
            </span>
            <span className="text-neutral-600"> · Class: </span>
            <span className="font-medium">{student.className}</span>
            <span className="text-neutral-600"> · Section: </span>
            <span className="font-medium">{student.sectionName}</span>
          </p>
          <p>
            {student.groupName && (
              <>
                <span className="text-neutral-600">Group: </span>
                <span className="font-medium">{student.groupName}</span>
              </>
            )}
          </p>
          {single && (
            <>
              <p>
                <span className="text-neutral-600">Father: </span>
                {student.fatherName}
              </p>
              <p>
                <span className="text-neutral-600">Mother: </span>
                {student.motherName}
              </p>
            </>
          )}
        </div>
      </div>

      <table
        className={
          single
            ? "mt-4 w-full border-collapse text-[9px]"
            : "mt-2 w-full border-collapse text-[8px]"
        }
      >
        <thead>
          <tr className="bg-neutral-100">
            <th className="w-7 border border-neutral-400 px-1 py-1 text-center font-semibold">
              #
            </th>
            <th className="border border-neutral-400 px-1 py-1 text-left font-semibold">
              Date
            </th>
            <th className="border border-neutral-400 px-1 py-1 text-left font-semibold">
              Subject
            </th>
            <th className="border border-neutral-400 px-1 py-1 text-left font-semibold">
              Time
            </th>
            <th className="w-[28mm] border border-neutral-400 px-1 py-1 text-left font-semibold">
              Signature
            </th>
          </tr>
        </thead>
        <tbody>
          {routine.map((paper, index) => (
            <tr
              key={`${paper.examDate}-${paper.subjectName}-${index}`}
              className="break-inside-avoid"
            >
              <td
                className={
                  single
                    ? "border border-neutral-300 px-1 py-2.5 text-center tabular-nums"
                    : "border border-neutral-300 px-1 py-[5px] text-center tabular-nums"
                }
              >
                {index + 1}
              </td>
              <td className="border border-neutral-300 px-1 whitespace-nowrap">
                {prettyDate(paper.examDate)}
              </td>
              <td className="border border-neutral-300 px-1">
                {paper.subjectName}
              </td>
              <td className="border border-neutral-300 px-1 whitespace-nowrap tabular-nums">
                {paper.startsAt}–{paper.endsAt}
              </td>
              <td className="border border-neutral-300" />
            </tr>
          ))}
        </tbody>
      </table>

      {routine.length === 0 && (
        <p className="mt-2 text-[8px] text-neutral-600">
          No routine has been published for this class yet.
        </p>
      )}

      <SheetFooter data={data} />
    </section>
  );
}
