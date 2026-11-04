import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { db } from "@/src/drizzle-DB";
import { instituteProfile } from "@/src/drizzle-DB/schema";
import { getExamRoutine } from "@/app/dashboard/exam/_actions/routine.action";
import { PrintBar } from "../../_components/print-bar";
import { formatDateCompact } from "@/src/lib/date";

const prettyDate = (iso: string) => formatDateCompact(iso);

// Printable routine: the same matrix the dashboard shows, laid out for paper
// with the institute's signature block at the bottom.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const { examId } = await params;

  // ?classes=a,b narrows the sheet: schools print one class at a time as often
  // as they print the whole routine
  const query = await searchParams;
  const raw = Array.isArray(query.classes) ? query.classes[0] : query.classes;
  const classFilter = (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => UUID.test(id));
  const [result, ctx] = await Promise.all([
    getExamRoutine({ examId }),
    getUserContext(),
  ]);

  if (!result.success || !ctx) notFound();

  const { data } = result;
  const [institute] = await db
    .select({
      nameEnglish: instituteProfile.nameEnglish,
      nameBangla: instituteProfile.nameBangla,
      logo: instituteProfile.logo,
      signature: instituteProfile.signature,
      eiin: instituteProfile.eiin,
    })
    .from(instituteProfile)
    .where(eq(instituteProfile.id, ctx.instituteId))
    .limit(1);

  const filtered =
    classFilter.length > 0
      ? data.rows.filter((row) => classFilter.includes(row.classId))
      : data.rows;
  const classes =
    classFilter.length > 0
      ? data.classes.filter((klass) => classFilter.includes(klass.id))
      : data.classes;

  const theory = filtered.filter((row) => row.kind === "THEORY");
  const practical = filtered.filter((row) => row.kind === "PRACTICAL");
  const single = classes.length === 1;

  const dates = [...new Set(filtered.map((row) => row.examDate))].sort();
  const slotsAt = (date: string, classId: string) =>
    theory.filter((row) => row.examDate === date && row.classId === classId);

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:p-0">
      <PrintBar
        title="Exam routine"
        subtitle={data.exam.name}
        backHref={`/dashboard/exam/routine?exam=${examId}`}
        backLabel="Routine"
      />

      <div className="print-exact rounded-lg border p-6 text-black print:rounded-none print:border-0 print:p-0">
        <header className="mb-5 flex items-start gap-4 border-b pb-4">
          {institute?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institute.logo}
              alt=""
              className="size-14 shrink-0 rounded object-contain"
            />
          ) : (
            <div className="size-14 shrink-0 rounded bg-neutral-100" />
          )}
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-lg font-semibold text-black">
              {institute?.nameBangla || institute?.nameEnglish || "Institute"}
            </h1>
            {institute?.nameBangla && institute?.nameEnglish && (
              <p className="text-xs text-neutral-600">
                {institute.nameEnglish}
              </p>
            )}
            <p className="mt-1 text-sm font-medium text-black">
              {data.exam.name} — Examination Routine
              {single ? ` · ${classes[0].name}` : ""}
            </p>
            {institute?.eiin && (
              <p className="text-[11px] text-neutral-600">
                EIIN {institute.eiin}
              </p>
            )}
          </div>
          <div className="size-14 shrink-0" />
        </header>

        {dates.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-600">
            No sittings have been scheduled for this exam yet.
          </p>
        ) : (
          single ? (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-8 border border-neutral-500 bg-neutral-200 px-1.5 py-1.5 text-center font-semibold">
                  #
                </th>
                <th className="border border-neutral-500 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                  Date &amp; day
                </th>
                <th className="border border-neutral-500 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                  Subject
                </th>
                <th className="border border-neutral-500 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                  Time
                </th>
                <th className="border border-neutral-500 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {theory.map((slot, index) => (
                <tr key={slot.id} className="break-inside-avoid">
                  <td className="border border-neutral-400 px-1.5 py-1.5 text-center text-neutral-700 tabular-nums">
                    {index + 1}
                  </td>
                  <td className="border border-neutral-400 px-2 py-1.5 whitespace-nowrap">
                    {prettyDate(slot.examDate)}
                  </td>
                  <td className="border border-neutral-400 px-2 py-1.5">
                    {slot.subjectName}
                  </td>
                  <td className="border border-neutral-400 px-2 py-1.5 whitespace-nowrap tabular-nums">
                    {slot.startsAt} – {slot.endsAt}
                  </td>
                  <td className="border border-neutral-400 px-2 py-1.5 text-neutral-600">
                    {slot.note ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-8 border border-neutral-400 bg-neutral-200 px-1.5 py-1.5 text-center font-semibold">
                  #
                </th>
                <th className="border border-neutral-400 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                  Date &amp; day
                </th>
                {classes.map((klass) => (
                  <th
                    key={klass.id}
                    className="border border-neutral-400 bg-neutral-200 px-2 py-1.5 text-center font-semibold"
                  >
                    {klass.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date, rowIndex) => (
                <tr key={date} className="break-inside-avoid">
                  <td className="border border-neutral-400 px-1.5 py-1.5 text-center align-top text-neutral-700 tabular-nums">
                    {rowIndex + 1}
                  </td>
                  <td className="border border-neutral-400 px-2 py-1.5 align-top whitespace-nowrap">
                    {prettyDate(date)}
                  </td>
                  {classes.map((klass) => {
                    const cell = slotsAt(date, klass.id);
                    return (
                      <td
                        key={klass.id}
                        className="border border-neutral-400 px-2 py-1.5 text-center align-top"
                      >
                        {cell.length === 0 ? (
                          <span className="text-neutral-500">—</span>
                        ) : (
                          cell.map((slot) => (
                            <div key={slot.id}>
                              <p className="font-medium">
                                {slot.subjectName || slot.subjectShortName}
                              </p>
                              <p className="text-[10px] text-neutral-600 tabular-nums">
                                {slot.startsAt} – {slot.endsAt}
                              </p>
                              {slot.note && (
                                <p className="text-[10px] text-neutral-600">
                                  {slot.note}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          )
        )}

        {practical.length > 0 && (
          <section className="mt-5 break-inside-avoid">
            <h2 className="mb-1.5 text-xs font-semibold text-black">
              Practical examination
            </h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-neutral-400 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                    Date &amp; day
                  </th>
                  <th className="border border-neutral-400 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                    Class
                  </th>
                  <th className="border border-neutral-400 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                    Subject
                  </th>
                  <th className="border border-neutral-400 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                    Section
                  </th>
                  <th className="border border-neutral-400 bg-neutral-200 px-2 py-1.5 text-left font-semibold">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {practical.map((slot) => (
                  <tr key={slot.id} className="break-inside-avoid">
                    <td className="border border-neutral-400 px-2 py-1.5 whitespace-nowrap">
                      {prettyDate(slot.examDate)}
                    </td>
                    <td className="border border-neutral-400 px-2 py-1.5">
                      {slot.className}
                    </td>
                    <td className="border border-neutral-400 px-2 py-1.5">
                      {slot.subjectName}
                    </td>
                    <td className="border border-neutral-400 px-2 py-1.5">
                      {slot.sectionName ?? "All sections"}
                    </td>
                    <td className="border border-neutral-400 px-2 py-1.5 tabular-nums">
                      {slot.startsAt} – {slot.endsAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {data.notice.trim() && (
          <section className="mt-5 break-inside-avoid border-t border-neutral-400 pt-2">
            <p className="mb-1 text-[11px] font-semibold tracking-wide text-black uppercase">
              Notice
            </p>
            <p className="text-[11px] leading-relaxed whitespace-pre-line text-neutral-700">
              {data.notice}
            </p>
          </section>
        )}

        <footer className="mt-12 flex items-end justify-between gap-8 break-inside-avoid">
          <div className="text-center">
            <div className="h-[7mm] w-[35mm]" />
            <div className="w-[35mm] border-t border-neutral-500 pt-1 text-[10px]">
              Examination in-charge
            </div>
          </div>

          <div className="text-center">
            {institute?.signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={institute.signature}
                alt=""
                className="mx-auto h-[8mm] w-auto max-w-[35mm] object-contain"
              />
            ) : (
              <div className="h-[7mm] w-[35mm]" />
            )}
            <div className="w-[35mm] border-t border-neutral-500 pt-1 text-[10px]">
              Principal
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
