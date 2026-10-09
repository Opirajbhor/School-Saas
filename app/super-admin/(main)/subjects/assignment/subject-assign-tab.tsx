"use client";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  inputSubAssignType,
  OutputSubjectType,
  subjectAssignmentZod,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClassWithGroups } from "../../classes/_actions/classes.action";
import { ClassesWithGroups } from "@/src/validation/classes.zod";
import {
  getDefaultSubjects,
  subjectAssignment,
} from "../_actions/subjects.action";
import { FormCheckboxGroup } from "@/components/forms/form-checkbox-group";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { FormCheckbox } from "@/components/forms/form-checkbox";

export function SubjectAssign() {
  // --------------query ------------------
  const queryClient = useQueryClient();

  // get active class data
  const { data: classData = [] } = useQuery<ClassesWithGroups[]>({
    queryKey: ["page-subject", "classGroups"],
    queryFn: async () => {
      const result = await getClassWithGroups();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as ClassesWithGroups[];
    },
  });
  // get active subject data
  const { data: subjectData = [] } = useQuery<OutputSubjectType[]>({
    queryKey: ["page-subject", "subjectAssignment"],
    queryFn: async () => {
      const result = await getDefaultSubjects();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as OutputSubjectType[];
    },
  });

  // --------form----------------
  const form = useForm<inputSubAssignType>({
    resolver: zodResolver(subjectAssignmentZod),
    defaultValues: {
      groupId: null,
      subjectIds: [],
      isOptional: false,
      isReligion: false,
      subject_type: "COMPULSORY",
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

  return (
    <div className=" rounded-xl border border-border bg-card p-3 shadow-sm">
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
                label: item?.name,
                value: item?.id as string,
              }))}
            description={form.formState.errors.classId?.message}
          />

          {/* ----------------Groups-------------- */}
          <FormSelect
            control={form.control}
            name="groupId"
            label="Group Name"
            options={(selectedClassData?.groupClasses ?? []).map((item) => ({
              label: item?.group?.name,
              value: item?.group?.id,
            }))}
            description={form.formState.errors.groupId?.message}
          />
          {/* ----------------subject type-------------- */}
          <FormSelect
            control={form.control}
            name="subject_type"
            label="Subject Type"
            options={[
              { value: "COMPULSORY", label: "COMPULSORY" },
              { value: "GROUP_BASED", label: "GROUP_BASED" },
            ]}
            description={form.formState.errors.groupId?.message}
          />
          {/* is religion */}
          <FormCheckbox
            control={form.control}
            name="isReligion"
            label="Check if Religion Subjjct"
            description={form.formState.errors.isReligion?.message}
          />
          {/* is optional */}
          <FormCheckbox
            control={form.control}
            name="isOptional"
            label="Check if Optional Subjjct"
            description={form.formState.errors.isOptional?.message}
          />

          {/* --------subjects list-------------- */}

          <FormCheckboxGroup
            control={form.control}
            name="subjectIds"
            label="Select Subjects"
            options={
              subjectData?.map((item) => ({
                label: item.name,
                value: item.id,
                disabled: item.status !== "ACTIVE",
              })) ?? []
            }
            description={form.formState.errors.subjectIds?.message}
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
  );
}
