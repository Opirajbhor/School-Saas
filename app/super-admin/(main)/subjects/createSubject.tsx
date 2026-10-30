"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";

import {
  InputSubjectType,
  inputSubjectZod,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { FormInput } from "@/components/forms/form-input";
import { createAcademicsubjects } from "./_actions/subjects.action";

export default function CreateSubject() {
  // -------------- form -------------------
  // A subject row stores only its identity (name / code / short name). Whether it
  // is compulsory, group-based or religious is decided per class when the subject
  // is assigned, and lives on subject_assignments.
  const form = useForm<InputSubjectType>({
    resolver: zodResolver(inputSubjectZod),
    defaultValues: {
      name: "",
      code: "",
      shortName: "",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;
  // add button
  const addBtn = async (data: InputSubjectType) => {
    await handleCrudAction(createAcademicsubjects, data, {
      successMessage: "Subject Created Successfully",
      onSuccess: () => {
        form.reset();
      },
    });
  };

  // reset the form value if sub type changes

  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      {/* <!-- --------- Add subject Form -------------> */}
      <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
          Add subject
        </h3>

        <FormProvider {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            {/* ------- name ----------- */}

            <FormInput
              control={form.control}
              label="Subject Name"
              name="name"
              placeholder="e.g., Bangla 1st Paper"
            />
            {/*----------- shortName -----------*/}

            <FormInput
              control={form.control}
              label="Subject Short Name"
              name="shortName"
              placeholder="e.g., Bng, Eng"
            />

            {/*---------- code -----------*/}
            <FormInput
              control={form.control}
              label="Subject Code"
              name="code"
              placeholder="e.g., 101, 102"
            />

            {/* -------submit button------------- */}
            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Subject
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
