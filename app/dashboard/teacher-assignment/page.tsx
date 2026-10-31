import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/page-header";
import SubjectTeacherAssign from "./subject-teacher-assign-page";
import { ClassTeacherAssign } from "./class-teacher-assign-page";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Teacher assignments"
        subtitle="One class teacher per section, and a subject teacher for every paper."
      />

      <Tabs defaultValue="class-teacher" className="gap-4">
        <TabsList className="mx-auto h-11 w-fit gap-1 p-1">
          <TabsTrigger
            value="class-teacher"
            className="cursor-pointer px-6 text-sm font-medium"
          >
            Class teachers
          </TabsTrigger>
          <TabsTrigger
            value="subject-teacher"
            className="cursor-pointer px-6 text-sm font-medium"
          >
            Subject teachers
          </TabsTrigger>
        </TabsList>

        {/*---------- class teacher assignment --------------*/}
        <TabsContent value="class-teacher">
          <ClassTeacherAssign />
        </TabsContent>

        {/*---------- subject teacher assignment --------------*/}
        <TabsContent value="subject-teacher">
          <SubjectTeacherAssign />
        </TabsContent>
      </Tabs>
    </main>
  );
}
