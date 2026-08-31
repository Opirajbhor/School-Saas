"use client";
import { FormCheckboxGroup } from "@/components/forms/form-checkbox-group";
import { FormSelect } from "@/components/forms/form-select";
import { SpinnerCustom } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import { getActiveClasses } from "@/src/server-actions/classes.action";
import { getSubjects } from "@/src/server-actions/subjects.action";
import { OutputGroupClassType } from "@/src/validation/groups.zod";
import {
  inputSubAssignType,
  outputSubjectType,
  subjectAssignmentZod,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

export function SubjectAssignTab() {
  const [loading, setLoading] = useState<boolean>(true);
  const [classData, setClassData] = useState<
    OutputGroupClassType[] | undefined
  >(undefined);
  const [subjects, setSubjects] = useState<outputSubjectType[] | undefined>(
    undefined,
  );

  const form = useForm<inputSubAssignType>({
    resolver: zodResolver(subjectAssignmentZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;
  const methods = useForm();

  useEffect(() => {
    async function getlist() {
      await clientReadAction(getActiveClasses, {
        onSuccess: (data) => {
          setClassData(data as OutputGroupClassType[]);
        },
        onLoading: setLoading,
      });

      await clientReadAction(getSubjects, {
        onSuccess: (data) => {
          setSubjects(data as outputSubjectType[]);
        },
        onLoading: setLoading,
      });
    }
    getlist();
  }, []);
  // ----------- selected Class assigned groups list-------------
  const selectedClassId = useWatch({
    control: form.control,
    name: "classId",
  });
  const selectedClassData = classData?.find(
    (item) => item.id === selectedClassId,
  );

  // add button
  const addBtn = async (data: inputSubAssignType) => {
    console.log(data);
    await handleCrudAction(subjectAssignment, data, {
      successMessage: "Subjects Assigned Successfully",
    });
  };

  if (loading) {
    return <SpinnerCustom />;
  }
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Data Table Section */}

        {/* <!--  Add subject Form --> */}
        <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Subject Assignment
          </h3>

          {/*  subject assign form */}
          <FormProvider {...methods}>
            <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
              {/* -----------------Classes---------------- */}
              <FormSelect
                control={form.control}
                name="classId"
                label="Classes Name"
                options={(classData ?? [])
                  .filter((item) => item.id !== undefined)
                  .map((item) => ({
                    label: item.name,
                    value: item.id as string,
                  }))}
              />

              {/* ----------------Groups-------------- */}
              <FormSelect
                control={form.control}
                name="groupId"
                label="Group Name"
                options={(selectedClassData?.groupClasses ?? []).map(
                  (item) => ({
                    label: item.group.name,
                    value: item.group.id as string,
                  }),
                )}
              />

              {/* ----------------Subject Type-------------- */}

              <FormSelect
                control={form.control}
                name="subjectType"
                label="Subject Types"
                options={[
                  { label: "COMPULSORY", value: "COMPULSORY" },
                  { label: "GROUP_BASED", value: "GROUP_BASED" },
                  { label: "OPTIONAL", value: "OPTIONAL" },
                ]}
              />

              {/* --------subjects list-------------- */}

              <FormCheckboxGroup
                control={form.control}
                name="subjectIds"
                label="Select Subjects"
                options={
                  subjects?.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })) ?? []
                }
              />

              <Button disabled={isSubmitting} variant="default" type="submit">
                {isSubmitting ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}{" "}
                Add Subject
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
