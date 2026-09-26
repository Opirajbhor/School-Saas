"use client";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { examZod, InputExamType } from "../_schema/exam.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { postExam } from "../_actions/exam.action";
import { FormProvider, useForm } from "react-hook-form";

export const ExamCreate = () => {
  // -------------- form -------------------
  const form = useForm<InputExamType>({
    resolver: zodResolver(examZod),
    defaultValues: {
      name: "",
    },
  });
  const { isSubmitting } = form.formState;

  // add button
  const addBtn = async (data: InputExamType) => {
    await handleCrudAction(postExam, data, {
      successMessage: "Exam Created Successfully",
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <div>
      <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
          Add Exam
        </h3>

        <FormProvider {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            {/* ------- name ----------- */}

            <FormInput
              control={form.control}
              label="Exam  Name"
              type="text"
              name="name"
              placeholder="e.g., Half-Yearly, Annual"
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
              Add Exam
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
