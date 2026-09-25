"use client";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  examMarkTypesZod,
  InputExamMarkTypes,
  OutputExamMarkTypes,
} from "../_schema/exam.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerCustom } from "@/components/Spinner";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { postMarkTypes } from "../_actions/exam.action";
import { FormProvider, useForm } from "react-hook-form";

export const ExamMarkTypeComponent = () => {
  const queryClient = useQueryClient();

  // const { data: markTypes = [], isPending } = useQuery<OutputExamMarkTypes[]>({
  //   queryKey: ["exam", "markTypes"],
  //   queryFn: async () => {
  //     const result = await getSubjects();
  //     if (!result.success) {
  //       throw new Error(result.error);
  //     }
  //     return result.data as OutputExamMarkTypes[];
  //   },
  // });

  // -------------- form -------------------
  const form = useForm<InputExamMarkTypes>({
    resolver: zodResolver(examMarkTypesZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;

  // add button
  const addBtn = async (data: InputExamMarkTypes) => {
    await handleCrudAction(postMarkTypes, data, {
      successMessage: "Exam Mark Type Created Successfully",
    });
  };
  // if (isPending) {
  //   return <SpinnerCustom />;
  // }
  return (
    <div>
      <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
          Add Exam Mark Type
        </h3>

        <FormProvider {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            {/* ------- name ----------- */}

            <FormInput
              control={form.control}
              label="Exam Mark Type Name"
              name="name"
              placeholder="e.g., CQ, MCQ, PR"
            />

            {/* ---------STATUS-------- */}
            <FormSelect
              control={form.control}
              name="status"
              label="Status"
              options={[
                { label: "ACTIVE", value: "ACTIVE" },
                { label: "INACTIVE", value: "INACTIVE" },
              ]}
            />

            {/* -------submit button------------- */}
            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Mark Type
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ExamMarkTypeComponent;
