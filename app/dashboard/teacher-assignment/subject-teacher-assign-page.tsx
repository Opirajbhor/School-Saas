"use client";
import { FormSelect } from "@/components/forms/form-select";
import { SpinnerCustom } from "@/components/Spinner";
import { AppTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getActiveClassesSection,
  getSingleClassSubjects,
} from "@/src/server-actions/teacher-assignment.action";
import { fetchData } from "@/src/tanstackQuery/queryReturnDataFn";
import { ClassWithSectionType } from "@/src/validation/classes.zod";

import {
  classSubjectGroupType,
  classSubjectGroupZod,
  InputSubjectTeacherType,
  subjectTeacherZod,
} from "@/src/validation/teacher-assignment.zod";
import { Teacherlist } from "@/src/validation/teacher.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import AssingTeacherModal from "./sub-teacher-assign-compo";

const SubjectTeacherAssign = () => {
  const [selectedSub, setSelectedSub] = useState<string[]>([]);
  const [searchParams, setSearchParams] =
    useState<classSubjectGroupType | null>(null);
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

  // reset the form value if class changes
  useEffect(() => {
    form.setValue("sectionId", "");
  }, [selectedClassId, form]);

  // ----------Search button---------------
  const { data: sectionSubData } = useQuery({
    queryKey: ["single-class-subjects", searchParams],
    queryFn: () => fetchData(() => getSingleClassSubjects(searchParams!)),
    enabled: !!searchParams,
  });

  const searchBtn = (data: classSubjectGroupType) => {
    setSearchParams(data);
  };
  const allTeachers = (sectionSubData?.teachers as Teacherlist[]) ?? [];
  // ------- selected class and section
  const classData =
    (sectionSubData?.class as ClassWithSectionType) ?? undefined;

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
                {/* <FormSelect
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
                /> */}

                <Button disabled={isSubmitting} type="submit">
                  Search
                </Button>
              </form>
            </FormProvider>

            {/* ---------select class and section card---------- */}
            <div className="flex items-center justify-center gap-5 mt-10">
              <Card className="p-5 w-80">
                <h2>Selected Class</h2> <span>{classData?.name}</span>
              </Card>
              <Card className="p-5 w-80">
                <h2>Selected Section</h2>{" "}
                <span>{classData?.sections[0].name}</span>
              </Card>
            </div>
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
                  render: (item) => (
                    <AssingTeacherModal
                      classData={classData}
                      teacherData={allTeachers}
                      subjectId={item.subjectId}
                    />
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
