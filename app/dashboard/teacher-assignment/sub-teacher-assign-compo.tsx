"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClassWithSectionType } from "@/src/validation/classes.zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Teacherlist } from "@/src/validation/teacher.zod";
import {
  InputSubjectTeacherType,
  subjectTeacherZod,
} from "@/src/validation/teacher-assignment.zod";
import { FormSelect } from "@/components/forms/form-select";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { assignSubjectTeacher } from "@/src/server-actions/teacher-assignment.action";

export default function AssingTeacherModal({
  classData,
  teacherData,
  subjectId,
}: {
  classData: ClassWithSectionType;
  teacherData: Teacherlist[];
  subjectId: string;
}) {
  // ------------- query fn ---------------
  const queryClient = useQueryClient();

  const form = useForm<InputSubjectTeacherType>({
    resolver: zodResolver(subjectTeacherZod),
    defaultValues: {
      classId: classData.sections[0].classId,
      sectionId: classData.sections[0].id,
      subjectId: subjectId,
    },
  });
  const { isSubmitting } = form.formState;

  const handleSubmit = async (data: InputSubjectTeacherType) => {
    await handleCrudAction(assignSubjectTeacher, data, {
      successMessage: "Teacher Assigned Successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["single-class-subjects"],
        });
        form.reset();
      },
    });
  };

  return (
    <div>
      <FormProvider {...form}>
        <form
          className="flex items-center gap-2"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormSelect
            control={form.control}
            name="teacherId"
            label=""
            options={
              teacherData?.map((item) => ({
                value: item.id,
                label: item.nameEnglish,
              })) ?? []
            }
          />
          <Button
            disabled={isSubmitting}
            className="cursor-pointer"
            type="submit"
            size="sm"
          >
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            Assign
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}
