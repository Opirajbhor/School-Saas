import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubjectTeacherAssign from "./subject-teacher-assign-page";
import { ClassTeacherAssign } from "./class-teacher-assign-page";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");
  return (
    <div>
      <div className="p-3">
        <Tabs defaultValue="class-teacher">
          <TabsList>
            <TabsTrigger
              value="class-teacher"
              className=" w-full cursor-pointer"
            >
              Class Teacher Assignments
            </TabsTrigger>
            <TabsTrigger value="subject-teacher" className="cursor-pointer">
              Subject Teacher Assignments
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
      </div>
    </div>
  );
}
