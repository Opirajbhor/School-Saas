import { DataTable } from "@/components/table/tanstack/data-table";
import { ExamMarkTypeColumn } from "../../_table/exam-marktype-columns";
import { SpinnerCustom } from "@/components/Spinner";
import { OutputExamMarkTypes } from "../../_schema/exam.zod";
import ExamMarkTypeComponent from "../../_component/exam-marktypes";
import { getDefaultMarkTypes } from "../../_actions/exam.action";

export default async function Page() {
  const result = await getDefaultMarkTypes();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const examTypes = result.data;
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
                data={examTypes as OutputExamMarkTypes[]}
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
