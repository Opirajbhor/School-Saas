import { notFound, redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getAdmitCards } from "../../_actions/admit-card.action";
import { PrintBar } from "../../_components/print-bar";
import { AdmitCard } from "../../_components/admit-card";

// Admit cards for one exam + class (+ section): two per A4 page, stacked.
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
  const query = await searchParams;
  const pick = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const classId = pick("class");
  if (!classId) notFound();

  const result = await getAdmitCards({
    examId,
    classId,
    sectionId: pick("section") ?? null,
  });
  if (!result.success) notFound();

  const { data } = result;

  // pairs, so each page holds exactly two cards
  const pages: (typeof data.students)[] = [];
  for (let i = 0; i < data.students.length; i += 2) {
    pages.push(data.students.slice(i, i + 2));
  }

  const back = `/dashboard/admit-cards?exam=${examId}&class=${classId}${
    data.section ? `&section=${data.section.id}` : ""
  }`;

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:p-0">
      <PrintBar
        title="Admit cards"
        subtitle={`${data.exam.name} · ${data.klass.name}${
          data.section ? ` · ${data.section.name}` : ""
        } · ${data.students.length} student${
          data.students.length === 1 ? "" : "s"
        } · ${pages.length} page${pages.length === 1 ? "" : "s"}`}
        backHref={back}
        backLabel="Admit cards"
      />

      {data.students.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No students in this class for that session
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Admit cards are issued from active enrolments in the exam&apos;s
            session.
          </p>
        </div>
      ) : (
        <div className="space-y-4 print:space-y-0">
          {pages.map((pair, index) => (
            <section
              key={index}
              className={
                index < pages.length - 1
                  ? "space-y-4 break-after-page print:space-y-4"
                  : "space-y-4"
              }
            >
              {pair.map((student) => (
                <AdmitCard
                  key={student.enrollmentId}
                  data={data}
                  student={student}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
