import { DataTable } from "@/components/table/tanstack/data-table";
import { SpinnerCustom } from "@/components/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <h1>Exam Management</h1>
        <div>
          <Tabs defaultValue="exam">
            <TabsList>
              <TabsTrigger value="exam" className=" w-full cursor-pointer">
                Exam Management
              </TabsTrigger>
              <TabsTrigger value="exam-assign" className="cursor-pointer">
                Exam Assignments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="exam">
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
            </TabsContent>
            <TabsContent value="exam-assign"></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
