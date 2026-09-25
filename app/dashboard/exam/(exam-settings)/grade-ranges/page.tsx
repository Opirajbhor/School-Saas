import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { DataTable } from "@/components/table/tanstack/data-table";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { examGradeRangeDrizzle } from "@/src/drizzle-DB/schema";
import { SpinnerCustom } from "@/components/Spinner";
import { OutputExamGradeRangeType } from "../../_schema/exam.zod";
import { ExamGradeRangeColumn } from "../../_table/exam-graderange-columns";
import ExamGradeRangeComponent from "../../_component/exam-graderanges";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const examGrades = await readMany({
    drizzleSchema: examGradeRangeDrizzle,
  });
  if (!examGrades.success) {
    return <SpinnerCustom />;
  }
  return (
    <div>
      <div>
        <h1>Exam Management</h1>
        <h3>Exam Grade Ranges Management</h3>
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Data Table Section */}
            <div className="lg:col-span-4">
              <DataTable
                columns={ExamGradeRangeColumn}
                data={examGrades?.data as OutputExamGradeRangeType[]}
              />
            </div>
            <div>
              <ExamGradeRangeComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
