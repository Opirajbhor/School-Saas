import { notFound, redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getAdmitCards } from "../../_actions/admit-card.action";
import { PrintBar } from "../../_components/print-bar";
import {
  AttendanceRegister,
  AttendanceStudentBlock,
} from "../../_components/attendance-sheet";

// Attendance sheets for one exam + class (+ section).
//
//   layout=all  one register: every student on a row, one column per paper
//   layout=2    two students to a page, each with a signature against every paper
//   layout=1    one student to a full page, with room to write
const LAYOUTS = ["all", "2", "1"] as const;
type Layout = (typeof LAYOUTS)[number];

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

  const layout = (LAYOUTS.includes(pick("layout") as Layout)
    ? pick("layout")
    : "all") as Layout;

  const result = await getAdmitCards({
    examId,
    classId,
    sectionId: pick("section") ?? null,
  });
  if (!result.success) notFound();

  const { data } = result;

  const pairs: (typeof data.students)[] = [];
  if (layout !== "all") {
    const step = layout === "2" ? 2 : 1;
    for (let i = 0; i < data.students.length; i += step) {
      pairs.push(data.students.slice(i, i + step));
    }
  }

  const back = `/dashboard/attendance?exam=${examId}&class=${classId}${
    data.section ? `&section=${data.section.id}` : ""
  }&layout=${layout}`;

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:p-0">
      <PrintBar
        title="Attendance sheets"
        subtitle={`${data.exam.name} · ${data.klass.name}${
          data.section ? ` · ${data.section.name}` : ""
        } · ${data.students.length} student${
          data.students.length === 1 ? "" : "s"
        } · ${
          layout === "all"
            ? "one register"
            : layout === "2"
              ? "two per page"
              : "one per page"
        }`}
        backHref={back}
        backLabel="Attendance"
      />

      {data.students.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No students in this class for that session
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sheets are issued from active enrolments in the exam&apos;s session.
          </p>
        </div>
      ) : layout === "all" ? (
        <AttendanceRegister data={data} />
      ) : (
        <div className="space-y-4 print:space-y-0">
          {pairs.map((group, index) => (
            <section
              key={index}
              className={
                index < pairs.length - 1
                  ? "space-y-4 break-after-page print:space-y-4"
                  : "space-y-4"
              }
            >
              {group.map((student) => (
                <AttendanceStudentBlock
                  key={student.enrollmentId}
                  data={data}
                  student={student}
                  single={layout === "1"}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
