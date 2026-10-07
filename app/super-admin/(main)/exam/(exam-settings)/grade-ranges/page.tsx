import { DataTable } from "@/components/table/tanstack/data-table";
import { SpinnerCustom } from "@/components/Spinner";
import { OutputExamGradeRangeType } from "../../_schema/exam.zod";
import { ExamGradeRangeColumn } from "../../_table/exam-graderange-columns";
import ExamGradeRangeComponent from "../../_component/exam-graderanges";
import { getDefaultGradeRange } from "../../_actions/exam.action";

export default async function Page() {
  const result = await getDefaultGradeRange();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const examGrades = result.data;
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
                data={examGrades as OutputExamGradeRangeType[]}
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
