import { notFound, redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getStudentCard } from "../../../_actions/id-card.action";
import { PrintBar } from "../../../_components/print-bar";
import { StudentIdCard } from "../../../_components/id-card";

// Printable student ID card, keyed by the student row. Everything on the card
// comes from the database — institute, student and the active enrolment.
export default async function Page({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const { studentId } = await params;
  const result = await getStudentCard(studentId);
  if (!result.success) notFound();

  const { data } = result;

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:p-0">
      <PrintBar
        title="Student ID card"
        subtitle={`${data.student.englishName} · ${data.student.studentId}`}
        backHref="/dashboard/students"
        backLabel="Students"
      />

      <div className="flex justify-center print:justify-start">
        <StudentIdCard data={data} />
      </div>
    </div>
  );
}
