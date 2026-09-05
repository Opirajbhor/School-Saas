"use client";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import { getActiveClassesSection } from "@/src/server-actions/teacher-assignment.action";

import {
  ClassSectionType,
  InputSubjectTeacherType,
  subjectTeacherZod,
} from "@/src/validation/teacher-assignment.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

const SubjectTeacherAssign = () => {
  const [classInfo, setClassInfo] = useState<ClassSectionType[] | undefined>(
    undefined,
  );

  const form = useForm<InputSubjectTeacherType>({
    resolver: zodResolver(subjectTeacherZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    const get = async () => {
      await clientReadAction(getActiveClassesSection, {
        onSuccess: (data) => {
          setClassInfo(data as ClassSectionType[]);
        },
      });
    };
    get();
  }, []);

  const selectedClassId = useWatch({
    control: form.control,
    name: "classId",
  });
  const sections =
    classInfo?.find((item) => item.id === selectedClassId)?.sections ?? [];
  // ---Search button----
  const addBtn = async (data: InputSubjectTeacherType) => {
    // await handleCrudAction(assignClassTeacher, data, {
    //   successMessage: "Student Created Successfully",
    //   onSuccess: (data) => {
    //     setClassTeachers((prev = []) => {
    //       const newItems = Array.isArray(data) ? data : [data];
    //       return [...prev, ...newItems] as classTeacherType[];
    //     });
    //     form.reset();
    //   },
    // });
    console.log(data);
  };
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
                onSubmit={form.handleSubmit(addBtn)}
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

                <Button disabled={isSubmitting} type="submit">
                  Assign
                </Button>
              </form>
            </FormProvider>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubjectTeacherAssign;
