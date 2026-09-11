"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubjectTeacherAssign from "./subject-teacher-assign-page";
import { ClassTeacherAssign } from "./class-teacher-assign-page";

export default function Page() {
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
