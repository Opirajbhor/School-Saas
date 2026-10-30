import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputExamType, sortAssignedClasses } from "../../_schema/exam.zod";
import { ExamCreateColumn } from "../../_table/exam-create-column";
import { exams } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { SpinnerCustom } from "@/components/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { eq, isNull, or } from "drizzle-orm";

export default async function Page() {
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

  // the "Assign Classes" cell joins the class names, so sort them into
  // academic order before they are joined
  for (const exam of examData) {
    if (exam.assignClasses) {
      exam.assignClasses = sortAssignedClasses(exam.assignClasses);
    }
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
                    data={examData as OutputExamType[]}
                  />
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
