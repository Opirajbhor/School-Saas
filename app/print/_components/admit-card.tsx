import { AdmitCardBatch, AdmitCardStudent } from "../_actions/admit-card.action";
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
 * One admit card, sized for half an A4 sheet (190 × 132 mm inside the page
 * margins) so two of them stack on a page.
 */
export function AdmitCard({
  data,
  student,
}: {
  data: AdmitCardBatch;
  student: AdmitCardStudent;
}) {
  const { institute, exam, routine } = data;

  return (
    <article className="admit-card flex h-[132mm] w-full flex-col border border-neutral-500 bg-white text-black">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-neutral-500 px-3 py-2">
        {institute.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={institute.logo}
            alt=""
            className="size-12 shrink-0 object-contain"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded bg-neutral-100 text-[9px] font-semibold text-neutral-500">
            {initials(institute.nameEnglish)}
          </div>
        )}

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[13px] leading-tight font-bold">
            {institute.nameBangla || institute.nameEnglish}
          </p>
          <p className="truncate text-[10px] leading-tight">
            {institute.nameEnglish}
          </p>
          <p className="truncate text-[8.5px] leading-tight text-neutral-600">
            {[institute.upazila, institute.district].filter(Boolean).join(", ")}
            {institute.eiin ? ` · EIIN ${institute.eiin}` : ""}
          </p>
          <p className="mt-0.5 inline-block border border-neutral-800 px-2 text-[9px] font-semibold tracking-wide uppercase">
            Admit Card — {exam.name}
            {exam.sessionYear ? ` ${exam.sessionYear}` : ""}
          </p>
        </div>

        <div className="w-12 shrink-0" />
      </header>

      {/* photo + details */}
      <div className="flex gap-3 px-3 py-2">
        <div className="flex w-[20mm] shrink-0 flex-col items-center">
          {student.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.photoUrl}
              alt={student.englishName}
              className="h-[24mm] w-[19mm] border border-neutral-400 object-cover"
            />
          ) : (
            <div className="flex h-[24mm] w-[19mm] items-center justify-center border border-neutral-400 bg-neutral-100 text-[10px] font-semibold text-neutral-500">
              {initials(student.englishName)}
            </div>
          )}
          <p className="mt-0.5 text-center text-[7.5px] text-neutral-600">
            Student ID
          </p>
          <p className="text-center text-[9px] font-semibold tabular-nums">
            {student.studentCode}
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
          <Detail label="Name" value={student.englishName} wide />
          {student.banglaName && (
            <Detail label="নাম" value={student.banglaName} wide />
          )}
          <Detail label="Father" value={student.fatherName} />
          <Detail label="Mother" value={student.motherName} />
          <Detail label="Class" value={student.className} />
          <Detail label="Section" value={student.sectionName} />
          <Detail label="Roll" value={student.roll} />
          <Detail label="Group" value={student.groupName ?? "—"} />
          <Detail label="Session" value={student.sessionYear} />
          <Detail label="Date of birth" value={student.dateOfBirth} />
        </div>
      </div>

      {/* the student's own class routine */}
      <div className="min-h-0 flex-1 px-3">
        <p className="mb-0.5 text-[8.5px] font-semibold tracking-wide uppercase">
          Examination routine
        </p>
        {routine.length === 0 ? (
          <p className="text-[9px] text-neutral-600">
            The routine for this class has not been published yet.
          </p>
        ) : (
          <table className="w-full border-collapse text-[8.5px]">
            <thead>
              <tr className="bg-neutral-100">
                <th className="w-6 border border-neutral-400 px-1 py-0.5 text-center font-semibold">
                  #
                </th>
                <th className="border border-neutral-400 px-1 py-0.5 text-left font-semibold">
                  Date
                </th>
                <th className="border border-neutral-400 px-1 py-0.5 text-left font-semibold">
                  Subject
                </th>
                <th className="border border-neutral-400 px-1 py-0.5 text-left font-semibold">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {routine.map((row, index) => (
                <tr key={`${row.examDate}-${row.subjectName}-${index}`}>
                  <td className="border border-neutral-300 px-1 py-[1.5px] text-center tabular-nums">
                    {index + 1}
                  </td>
                  <td className="border border-neutral-300 px-1 py-[1.5px] whitespace-nowrap">
                    {prettyDate(row.examDate)}
                  </td>
                  <td className="border border-neutral-300 px-1 py-[1.5px]">
                    {row.subjectName}
                    {row.kind === "PRACTICAL" && (
                      <span className="ml-1 text-[7.5px] text-neutral-600">
                        (practical)
                      </span>
                    )}
                  </td>
                  <td className="border border-neutral-300 px-1 py-[1.5px] whitespace-nowrap tabular-nums">
                    {row.startsAt}–{row.endsAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data.notice.trim() && (
          <p className="mt-1 text-[7.5px] leading-tight whitespace-pre-line text-neutral-700">
            <span className="font-semibold">Notice: </span>
            {data.notice}
          </p>
        )}
      </div>

      {/* signatures */}
      <footer className="mt-auto flex items-end justify-between gap-6 px-6 pb-2">
        <div className="text-center">
          <div className="h-[6mm] w-[32mm]" />
          <div className="w-[32mm] border-t border-neutral-500 pt-0.5 text-[8px]">
            Class teacher
          </div>
          {data.classTeacher && (
            <p className="text-[7.5px] text-neutral-600">{data.classTeacher}</p>
          )}
        </div>

        <div className="text-center">
          {institute.signature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institute.signature}
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
    </article>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <p className={wide ? "col-span-2 flex gap-1" : "flex gap-1"}>
      <span className="w-[16mm] shrink-0 text-neutral-600">{label}</span>
      <span className="truncate font-medium">: {value}</span>
    </p>
  );
}
