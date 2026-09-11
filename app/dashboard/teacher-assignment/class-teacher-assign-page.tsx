"use client";
import { FormSelect } from "@/components/forms/form-select";
import DeleteModal from "@/components/modal/delete-modal";
import { SpinnerCustom } from "@/components/Spinner";
import { AppTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import {
  assignClassTeacher,
  deleteAssignTeacher,
  getassignedClassTeachers,
} from "@/src/server-actions/teacher-assignment.action";
import {
  InputClassTeacherType,
  sectionClassTeacherZod,
} from "@/src/validation/teacher-assignment.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchData } from "@/src/tanstackQuery/queryReturnDataFn";
import { getClasses } from "@/src/server-actions/classes.action";
import { getTeacher } from "@/src/server-actions/teacher.action";
import { useState } from "react";

export function ClassTeacherAssign() {
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

  const queryClient = useQueryClient();
  // ------- tanstack Class Query  -------------
  const { data: classInfo = [], isPending: isClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => fetchData(getClasses),
  });
  // ------- tanstack Teacher Query  -------------
  const { data: teacherInfo = [], isPending: isTeacher } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => fetchData(getTeacher),
  });

  // ------- tanstack Class Teacher Query  -------------
  const { data: classTeachers = [], isPending: isClassTeacherPending } =
    useQuery({
      queryKey: ["classTeacher", "assigned"],
      queryFn: async () => fetchData(getassignedClassTeachers),
    });

  // ------------- form ------------------
  const form = useForm<InputClassTeacherType>({
    resolver: zodResolver(sectionClassTeacherZod),
    defaultValues: {},
  });

  const { isSubmitting } = form.formState;
  // ------------assignable Teacher list ------------
  const availableTeachers =
    teacherInfo?.filter(
      (teacher) => !classTeachers?.some((ct) => ct.teacherId === teacher.id),
    ) ?? [];

  // ------------- available section list------------
  const availableSections =
    classInfo
      ?.map((item) => ({
        ...item,
        sections: item.sections.filter(
          (sec) => !classTeachers?.some((ct) => sec.id === ct.sectionId),
        ),
      }))
      .filter((item) => item.sections.length > 0) ?? [];

  // --------get class id from react hook form -------------
  const selectedClassId = useWatch({
    control: form.control,
    name: "classId",
  });
  // ------------ get selected class sections --------------
  const selectedClass = availableSections.find(
    (item) => item.id === selectedClassId,
  );
  const selectedSectionId = useWatch({
    control: form.control,
    name: "sectionId",
  });

  // ------------- handle button add class teacher ---------------
  const addBtn = async (data: InputClassTeacherType) => {
    await handleCrudAction(assignClassTeacher, data, {
      successMessage: "Student Created Successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["classTeacher", "assigned"],
        });
        form.reset();
      },
    });
  };
  if (isClasses || isTeacher || isClassTeacherPending) {
    return <SpinnerCustom />;
  }
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <CardTitle>Class Teacher Assignments</CardTitle>
        </CardHeader>
        <div>
          {/* ------------- assignment form --------------- */}
          <FormProvider {...form}>
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
                  (availableSections ?? [])
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
                options={(availableTeachers ?? [])
                  .filter((item) => item.id !== undefined)
                  .filter((item) => item.status === "ACTIVE")
                  .map((item) => ({
                    label: item.nameEnglish as string,
                    value: item.id as string,
                  }))}
              />

              <Button disabled={isSubmitting} type="submit">
                Assign
              </Button>
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
                  <div className=" p-3">{item?.class?.name}</div>
                ),
              },

              {
                key: "sections",
                label: "Section",
                render: (item) => <div>{item?.section?.name}</div>,
              },

              {
                key: "teacherId",
                label: "Class Teacher",
                render: (item) => <div>{item?.teacher?.nameEnglish}</div>,
              },
              {
                key: "actions",
                label: "Actions",
                render: (item) => (
                  <div>
                    <DeleteModal
                      id={item.id}
                      onDelete={deleteAssignTeacher}
                      onSuccess={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["classTeacher", "assigned"],
                        })
                      }
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
