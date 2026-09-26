import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { ExamCreate } from "../../_component/exam-create";
import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputExamType } from "../../_schema/exam.zod";
import { ExamCreateColumn } from "../../_table/exam-create-column";
import { exams } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { SpinnerCustom } from "@/components/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const examGrades = await readMany({
    drizzleSchema: exams,
  });
  if (!examGrades.success) {
    return <SpinnerCustom />;
  }

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
                    data={examGrades?.data as OutputExamType[]}
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
