import { DataTable } from "@/components/table/tanstack/data-table";
import { SpinnerCustom } from "@/components/Spinner";
import { getDefaultExams } from "../../_actions/exam.action";
import { ExamCreateColumn } from "../../_table/exam-create-column";
import { OutputExamType } from "@/app/dashboard/exam/_schema/exam.zod";
import { ExamCreate } from "../../_component/exam-create";

export default async function Page() {
  const result = await getDefaultExams();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const examGrades = result.data;
  return (
    <div>
      <div>
        <h1 className="text-center m-5">Exam Management</h1>
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Data Table Section */}
            <div className="lg:col-span-4">
              <DataTable
                columns={ExamCreateColumn}
                data={examGrades as OutputExamType[]}
              />
            </div>
            <div>
              <ExamCreate />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
