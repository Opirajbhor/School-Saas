"use client";
import { FormSelect } from "@/components/forms/form-select";
import { SpinnerCustom } from "@/components/Spinner";
import { AppTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import {
  getActiveClassesSection,
  getSingleClassSubjects,
} from "@/src/server-actions/teacher-assignment.action";
import { getTeacher } from "@/src/server-actions/teacher.action";
import { fetchData } from "@/src/tanstackQuery/queryReturnDataFn";

import {
  classSubjectGroupType,
  classSubjectGroupZod,
  ClassSubjectType,
  InputSubjectTeacherType,
  subjectTeacherZod,
} from "@/src/validation/teacher-assignment.zod";
import { Teacherlist } from "@/src/validation/teacher.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

const SubjectTeacherAssign = () => {
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

  // ------- tanstack Query  -------------
  const { data: classInfo = [], isPending } = useQuery({
    queryKey: ["ClassSection", "active"],
    queryFn: async () => fetchData(getActiveClassesSection),
  });
  // ---------------- subject and teacher search form -------------
  const form = useForm<classSubjectGroupType>({
    resolver: zodResolver(classSubjectGroupZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;

  const selectedClassId = useWatch({
    control: form.control,
    name: "classId",
  });
  const sections =
    classInfo?.find((item) => item.id === selectedClassId)?.sections ?? [];
  const groups =
    classInfo?.find((item) =>
      item.groupClasses.some((g) => g.classId === selectedClassId),
    )?.groupClasses ?? [];

  // reset the form value if class changes
  useEffect(() => {
    form.setValue("sectionId", "");
    form.setValue("groupId", "");
  }, [selectedClassId, form]);

  // ----------Search button---------------
  const { mutate, data: sectionSubData } = useMutation({
    mutationFn: (data: classSubjectGroupType) =>
      fetchData(() => getSingleClassSubjects(data)),
  });
  const searchBtn = (data: classSubjectGroupType) => {
    mutate(data);
  };
  const allTeachers = (sectionSubData?.teachers as Teacherlist[]) ?? [];
  // ---------------- teacher assign to subject form -------------
  const form2 = useForm<InputSubjectTeacherType>({
    resolver: zodResolver(subjectTeacherZod),
    defaultValues: {},
  });

  // ---subject Teacher add fn----

  const AssignBtn = async (data: InputSubjectTeacherType) => {
    console.log("teacherid", data);
  };

  if (isPending) {
    return <SpinnerCustom />;
  }
  return (
    <div>
      <div className="p-3">
        <Card>
          <CardHeader>
            <CardTitle>Subject Teacher Assignments</CardTitle>
          </CardHeader>
          <div>
            {/* ------------- assignment form --------------- */}
            <FormProvider {...form}>
              <form
                className="flex items-center justify-center gap-10"
                onSubmit={form.handleSubmit(searchBtn)}
              >
                {/* ---------Select Class---------- */}
                <FormSelect
                  control={form.control}
                  name="classId"
                  label="Select Class"
                  options={
                    classInfo?.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })) ?? []
                  }
                />
                {/* ---------Select Section---------- */}
                <FormSelect
                  control={form.control}
                  name="sectionId"
                  label="Select Section"
                  options={
                    (sections ?? [])
                      .filter((item) => item.id !== undefined)
                      .filter((item) => item.status === "ACTIVE")
                      .map((item) => ({
                        value: item.id as string,
                        label: item.name as string,
                      })) ?? []
                  }
                />
                {/* ---------Select Groups---------- */}
                <FormSelect
                  control={form.control}
                  name="groupId"
                  label="Select Group"
                  options={
                    (groups ?? [])
                      .filter((item) => item.id !== undefined)
                      .map((item) => ({
                        value: item.group.id as string,
                        label: item.group.name as string,
                      })) ?? []
                  }
                />

                <Button disabled={isSubmitting} type="submit">
                  Search
                </Button>
              </form>
            </FormProvider>

            {/* ---------- subject assignment table----------- */}

            <AppTable
              data={sectionSubData?.tableData ?? []}
              searchable
              searchPlaceholder="Search Assigned Subjects..."
              searchKeys={["status", "className", "groupName", "subjectName"]}
              selectable
              selectedIds={selectedSub}
              onSelectionChange={setSelectedSub}
              toolbar={<></>}
              columns={[
                {
                  key: "subjectName",
                  label: "Subject Name",
                  render: (item) => item.subject.name,
                },
                {
                  key: "shortName",
                  label: "Subject Short Name",
                  render: (item) => item.subject.shortName,
                },

                {
                  key: "subjectType",
                  label: "Subject Type",
                  render: (item) => item.subjectType,
                },
                {
                  key: "teacherId",
                  label: "Assigned Teacher",
                  render: (item) => item.teacherName,
                },

                {
                  key: "actions",
                  label: "Select Teacher",
                  render: () => (
                    <FormProvider {...form2}>
                      <form
                        className="flex items-center gap-3"
                        onSubmit={form2.handleSubmit(AssignBtn)}
                      >
                        <FormSelect
                          control={form2.control}
                          name="teacherId"
                          label=""
                          options={
                            allTeachers?.map((t) => ({
                              label: t.nameEnglish,
                              value: t.id,
                            })) ?? []
                          }
                        />
                        <Button type="submit">Assign</Button>
                      </form>
                    </FormProvider>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubjectTeacherAssign;
