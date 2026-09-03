"use client";

import { FormSelect } from "@/components/forms/form-select";
import { SpinnerCustom } from "@/components/Spinner";
import { AppTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import {
  assignClassTeacher,
  getassignedClassTeachers,
  getClassWithTeacher,
} from "@/src/server-actions/teacher-assignment.action";
import {
  classTeacherType,
  InputClassTeacherType,
  OutputClassTeacherType,
  sectionClassTeacherZod,
} from "@/src/validation/teacher-assignment.zod";
import { Teacherlist } from "@/src/validation/teacher.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

export default function Page() {
  const [loading, setLoading] = useState<boolean>(false);

  const [classInfo, setClassInfo] = useState<OutputClassTeacherType[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<Teacherlist[]>([]);
  const [selectedSub, setSelectedSub] = useState<string[]>([]);
  const [classTeachers, setClassTeachers] = useState<
    classTeacherType[] | undefined
  >(undefined);
  useEffect(() => {
    const get = async () => {
      await clientReadAction(getClassWithTeacher, {
        onSuccess: (data) => {
          setClassInfo(data.classData.data as OutputClassTeacherType[]);
          setTeacherInfo(data.teacherInfo.data as Teacherlist[]);
        },
      });
      await clientReadAction(getassignedClassTeachers, {
        onLoading: setLoading,
        onSuccess: (data) => setClassTeachers(data as classTeacherType[]),
      });
    };
    get();
  }, []);

  const form = useForm({
    resolver: zodResolver(sectionClassTeacherZod),
    defaultValues: {},
  });

  const { isSubmitting } = form.formState;
  const methods = useForm();

  const selectedClassId = useWatch({
    control: form.control,
    name: "classId",
  });
  const selectedClass = classInfo.find((item) => item.id === selectedClassId);
  const selectedSectionId = useWatch({
    control: form.control,
    name: "sectionId",
  });

  const addBtn = async (data: InputClassTeacherType) => {
    await handleCrudAction(assignClassTeacher, data, {
      successMessage: "Student Created Successfully",
      onSuccess: (data) => {
        console.log(data);
        form.reset();
      },
    });
  };
  if (loading) {
    return <SpinnerCustom />;
  }
  return (
    <div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <div>
            <FormProvider {...methods}>
              <form
                className="flex items-center justify-center gap-10"
                onSubmit={form.handleSubmit(addBtn)}
              >
                {/* ---------Select Class---------- */}
                <FormSelect
                  control={form.control}
                  name="classId"
                  label="Select Class"
                  options={
                    (classInfo ?? [])
                      .filter((item) => item.id !== undefined)
                      .filter((item) => item.status === "ACTIVE")
                      .map((item) => ({
                        label: item.name,
                        value: item.id,
                      })) ?? []
                  }
                />
                {/* ---------Select Section---------- */}
                <FormSelect
                  control={form.control}
                  name="sectionId"
                  label="Select Section"
                  disabled={!selectedClassId}
                  options={(selectedClass?.sections ?? [])
                    .filter((item) => item.id !== undefined)
                    .filter((item) => item.status === "ACTIVE")
                    .map((item) => ({
                      label: item.name as string,
                      value: item.id as string,
                    }))}
                />
                {/* ---------Select Class Teacher---------- */}
                <FormSelect
                  control={form.control}
                  name="teacherId"
                  label="Select Class Teacher"
                  disabled={!selectedSectionId}
                  options={(teacherInfo ?? [])
                    .filter((item) => item.id !== undefined)
                    .filter((item) => item.status === "ACTIVE")
                    .map((item) => ({
                      label: item.nameEnglish as string,
                      value: item.id as string,
                    }))}
                />

                <Button type="submit">Assign</Button>
              </form>
            </FormProvider>
          </div>
          <CardContent className="p-3">
            {/* ---------table------- */}
            <AppTable
              data={classTeachers ?? []}
              searchable
              searchPlaceholder="Search Class Teacher..."
              searchKeys={["teacher", "class"]}
              selectable
              selectedIds={selectedSub}
              onSelectionChange={setSelectedSub}
              toolbar={
                <>
                  <Button variant="outline">Export</Button>
                </>
              }
              columns={[
                {
                  key: "name",
                  label: "Class Name",
                  render: (item) => (
                    <div className=" p-3">{item.class.name}</div>
                  ),
                },

                {
                  key: "sections",
                  label: "Section",
                  render: (item) => <div>{item.section.name}</div>,
                },

                {
                  key: "teacherId",
                  label: "Class Teacher",
                  render: (item) => <div>{item.teacher.nameEnglish}</div>,
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (item) => (
                    <div>
                      <Button variant={"destructive"}>Delete</Button>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
