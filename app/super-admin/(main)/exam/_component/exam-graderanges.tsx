"use client";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import {
  examGradeRangeZod,
  InputExamGradeRangeType,
} from "../_schema/exam.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { postGradeRange } from "../_actions/exam.action";
import { FormProvider, useForm } from "react-hook-form";
import { FormInputNumber } from "@/components/forms/form-input-number";

export const ExamGradeRangeComponent = () => {
  // -------------- form -------------------
  const form = useForm<InputExamGradeRangeType>({
    resolver: zodResolver(examGradeRangeZod),
    defaultValues: {
      minMark: undefined,
      maxMark: undefined,
      GPA: "",
      name: "",
    },
  });
  const { isSubmitting } = form.formState;

  // add button
  const addBtn = async (data: InputExamGradeRangeType) => {
    await handleCrudAction(postGradeRange, data, {
      successMessage: "Exam Grade Range Created Successfully",
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <div>
      <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
          Add Exam Grade Range
        </h3>

        <FormProvider {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            {/* ------- name ----------- */}

            <FormInput
              control={form.control}
              label="Exam Mark Type Name"
              type="text"
              name="name"
              placeholder="e.g., A+, A-, A"
            />
            {/* ------- Minimum Mark ----------- */}

            <FormInputNumber
              control={form.control}
              label="Minimum Mark"
              name="minMark"
              placeholder="e.g., 60,70,80"
            />
            {/* ------- Minimum Mark ----------- */}

            <FormInputNumber
              control={form.control}
              label="Maximum Mark"
              name="maxMark"
              placeholder="e.g., 70,80,100"
            />
            {/* ------- GPA ----------- */}

            <FormInput
              control={form.control}
              label="GPA"
              name="GPA"
              placeholder="e.g., 3.50, 4.00, 5.00"
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

export default ExamGradeRangeComponent;
