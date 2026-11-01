import { notFound, redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { getTeacherCard } from "../../../_actions/id-card.action";
import { PrintBar } from "../../../_components/print-bar";
import { TeacherIdCard } from "../../../_components/id-card";

export default async function Page({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const { teacherId } = await params;
  const result = await getTeacherCard(teacherId);
  if (!result.success) notFound();

  const { data } = result;

  return (
    <div className="mx-auto w-full max-w-[210mm] p-6 print:p-0">
      <PrintBar
        title="Teacher ID card"
        subtitle={`${data.teacher.nameEnglish} · ${data.teacher.designation}`}
        backHref="/dashboard/teachers"
        backLabel="Teachers"
      />

      <div className="flex justify-center print:justify-start">
        <TeacherIdCard data={data} />
      </div>
    </div>
  );
}
