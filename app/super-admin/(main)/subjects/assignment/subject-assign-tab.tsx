"use client";

import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { IoAddOutline as Plus } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormCheckboxGroup } from "@/components/forms/form-checkbox-group";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { ClassesWithGroups } from "@/src/validation/classes.zod";
import {
  inputSubAssignType,
  OutputSubjectType,
  subjectAssignmentZod,
} from "@/src/validation/subjects.zod";
import { getClassWithGroups } from "../../classes/_actions/classes.action";
import {
  getDefaultSubjects,
  subjectAssignment,
} from "../_actions/subjects.action";

const emptyAssign: inputSubAssignType = {
  classId: "",
  groupId: null,
  subjectIds: [],
  isOptional: false,
  isReligion: false,
  subject_type: "COMPULSORY",
};

export function SubjectAssign() {
  const router = useRouter();

  const { data: classData = [] } = useQuery<ClassesWithGroups[]>({
    queryKey: ["page-subject", "classGroups"],
    queryFn: async () => {
      const result = await getClassWithGroups();
      if (!result.success) throw new Error(result.error);
      return result.data as ClassesWithGroups[];
    },
  });

  const { data: subjectData = [] } = useQuery<OutputSubjectType[]>({
    queryKey: ["page-subject", "subjectOptions"],
    queryFn: async () => {
      const result = await getDefaultSubjects();
      if (!result.success) throw new Error(result.error);
      return result.data as OutputSubjectType[];
    },
  });

  const form = useForm<inputSubAssignType>({
    resolver: zodResolver(subjectAssignmentZod),
    defaultValues: emptyAssign,
  });
  const { isSubmitting } = form.formState;

  const selectedClassId = useWatch({ control: form.control, name: "classId" });
  const subjectType = useWatch({ control: form.control, name: "subject_type" });
  const selectedClassData = classData.find(
    (item) => item.id === selectedClassId,
  );

  const groupOptions = (selectedClassData?.groupClasses ?? [])
    .map((item) => ({
      label: item?.group?.name ?? "",
      value: item?.group?.id ?? "",
    }))
    .filter((option) => option.value);

  const addBtn = async (data: inputSubAssignType) => {
    await handleCrudAction(subjectAssignment, data, {
      successMessage: "Subjects assigned",
      onSuccess: () => {
        // the table is server-rendered, so refresh is the only reliable update
        router.refresh();
        form.reset(emptyAssign);
      },
    });
  };

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Assign subjects
        </h2>
        <p className="text-xs text-muted-foreground">
          Adds the selected subjects to one class.
        </p>
      </div>

      <FormProvider {...form}>
        <form className="space-y-4 p-4" onSubmit={form.handleSubmit(addBtn)}>
          <FormSelect
            control={form.control}
            name="classId"
            label="Class"
            placeholder="Select a class"
            options={classData
              .filter((item) => item.id)
              .map((item) => ({ label: item.name, value: item.id as string }))}
          />

          <FormSelect
            control={form.control}
            name="groupId"
            label="Group"
            placeholder={
              subjectType !== "GROUP_BASED"
                ? "Compulsory subjects apply to every group"
                : groupOptions.length
                  ? "Pick the group this subject belongs to"
                  : "This class has no groups yet"
            }
            disabled={subjectType !== "GROUP_BASED" || groupOptions.length === 0}
            options={groupOptions}
          />

          <FormSelect
            control={form.control}
            name="subject_type"
            label="Subject type"
            options={[
              { value: "COMPULSORY", label: "Compulsory" },
              { value: "GROUP_BASED", label: "Group based" },
            ]}
          />

          <div className="space-y-2.5 rounded-lg border p-3">
            <FormCheckbox
              control={form.control}
              name="isReligion"
              label="Religion subject"
              description="Counts as the religion paper for this class."
            />
            <FormCheckbox
              control={form.control}
              name="isOptional"
              label="Optional subject"
              description="Students may pick it instead of a compulsory paper."
            />
          </div>

          <FormCheckboxGroup
            control={form.control}
            name="subjectIds"
            label="Subjects"
            options={subjectData.map((item) => ({
              label: item.status === "ACTIVE" ? item.name : `${item.name} (inactive)`,
              value: item.id,
            }))}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : <Plus />}
            Assign subjects
          </Button>
        </form>
      </FormProvider>
    </Card>
  );
}
