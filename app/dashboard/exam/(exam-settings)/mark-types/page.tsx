import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { DataTable } from "@/components/table/tanstack/data-table";
import { ExamMarkTypeColumn } from "../../_table/exam-marktype-columns";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { examMarkTypesDrizzle } from "@/src/drizzle-DB/schema";
import { SpinnerCustom } from "@/components/Spinner";
import { OutputExamMarkTypes } from "../../_schema/exam.zod";
import ExamMarkTypeComponent from "../../_component/exam-marktypes";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const examTypes = await readMany({
    drizzleSchema: examMarkTypesDrizzle,
  });
  if (!examTypes.success) {
    return <SpinnerCustom />;
  }
  return (
    <div>
      <div>
        <h1>Exam Management</h1>
        <h3>Exam Types Management</h3>
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Data Table Section */}
            <div className="lg:col-span-4">
              <DataTable
                columns={ExamMarkTypeColumn}
                data={examTypes?.data as OutputExamMarkTypes[]}
              />
            </div>
            <div>
              <ExamMarkTypeComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
