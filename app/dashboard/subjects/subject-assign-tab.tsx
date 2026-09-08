"use client";
import { FormCheckboxGroup } from "@/components/forms/form-checkbox-group";
import { FormSelect } from "@/components/forms/form-select";
import { SpinnerCustom } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { getActiveClasses } from "@/src/server-actions/classes.action";
import {
  getAssignSubjects,
  subjectAssignment,
} from "@/src/server-actions/subjects.action";
import { OutputGroupClassType } from "@/src/validation/groups.zod";
import {
  inputSubAssignType,
  OutputSubAssignType,
  OutputSubjectType,
  subjectAssignmentZod,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { SubjectAssignTable } from "./assigned-subject-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function SubjectAssignTab() {
  // --------------query ------------------
  const queryClient = useQueryClient();
  // get cached subject data
  const subjects = queryClient.getQueryData(["subjects"]) as
    | OutputSubjectType[]
    | undefined;
  // get cached assign subject data
  const assignSubjects = queryClient.getQueryData([
    "page-subject",
    "assignSubjects",
  ]) as OutputSubAssignType[] | undefined;
  // get active class data
  const { data: classData = [], isPending } = useQuery<OutputGroupClassType[]>({
    queryKey: ["page-subject", "classWithSection"],
    queryFn: async () => {
      const result = await getActiveClasses();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as OutputGroupClassType[];
    },
  });
  // get assigned subject data for table
  const { isPending: isAssignSubjects } = useQuery<OutputSubAssignType[]>({
    queryKey: ["page-subject", "assignSubjects"],
    queryFn: async () => {
      const result = await getAssignSubjects();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as OutputSubAssignType[];
    },
  });

  const form = useForm<inputSubAssignType>({
    resolver: zodResolver(subjectAssignmentZod),
    defaultValues: {
      groupId: null,
    },
  });
  const { isSubmitting } = form.formState;

  // ----------- selected Class assigned groups list-------------
  const selectedClassId = useWatch({
    control: form.control,
    name: "classId",
  });
  const selectedClassData = classData?.find(
    (item) => item.id === selectedClassId,
  );

  const subType = useWatch({
    control: form.control,
    name: "subjectType",
  });

  // get unique subjects
  const uniqueSubs = subjects?.filter(
    (item) =>
      item.subject_type === subType &&
      item.status === "ACTIVE" &&
      !assignSubjects?.some(
        (ass) => ass?.subjectId === item.id && ass?.classId === selectedClassId,
      ),
  );

  // --------- subject assign to class button -------------
  const addBtn = async (data: inputSubAssignType) => {
    await handleCrudAction(subjectAssignment, data, {
      successMessage: "Subjects Assigned Successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["page-subject", "assignSubjects"],
        });
      },
    });
  };

  if (isPending || isAssignSubjects) {
    return <SpinnerCustom />;
  }
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Data Table Section */}
        <div className="lg:col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <SubjectAssignTable />
        </div>
        {/* <!--  Add subject Form --> */}
        <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Subject Assignment
          </h3>

          {/*  subject assign form */}
          <FormProvider {...form}>
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
              {/* ----------------Subject Type-------------- */}

              <FormSelect
                control={form.control}
                name="subjectType"
                label="Subject Types"
                options={[
                  { label: "COMPULSORY", value: "COMPULSORY" },
                  { label: "GROUP_BASED", value: "GROUP_BASED" },
                  { label: "RELIGION", value: "RELIGION" },
                ]}
              />

              {/* ----------------Groups-------------- */}
              <FormSelect
                control={form.control}
                name="groupId"
                label="Group Name"
                disabled={subType !== "GROUP_BASED"}
                options={(selectedClassData?.groupClasses ?? []).map(
                  (item) => ({
                    label: item.group.name,
                    value: item.group.id as string,
                  }),
                )}
              />

              {/* --------subjects list-------------- */}

              <FormCheckboxGroup
                control={form.control}
                name="subjectIds"
                label="Select Subjects"
                options={
                  uniqueSubs?.map((item) => ({
                    label: item.name,
                    value: item.id,
                    disabled: item.status !== "ACTIVE",
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
