import {} from "@/components/ui/native-select";
import { ExamCard } from "./exam-card";
import { SpinnerCustom } from "@/components/Spinner";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { redirect } from "next/navigation";

import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { eq, isNull, or } from "drizzle-orm";
import { exams } from "@/src/drizzle-DB/schema";
import { OutputExamType } from "../../_schema/exam.zod";
import Link from "next/link";

export default async function ExamListPage() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const result = await readMany({
    drizzleSchema: exams,
    query: ({ db, instituteId }) =>
      db.query.exams.findMany({
        where: or(
          isNull(exams.instituteId),
          eq(exams.instituteId, instituteId),
        ),
        with: {
          assignClasses: {
            with: {
              class: true,
            },
          },
        },
      }),
  });
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const examData = result.data as OutputExamType[];

  return (
    <div className="min-h-screen bg-background p-6 text-foreground md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Available Exams
          </h2>
        </div>

        {/* Exam Cards Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {examData.map((exam) => (
            <Link key={exam.id} href={`/dashboard/exam/mark-entry/${exam.id}`}>
              <ExamCard exam={exam} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
