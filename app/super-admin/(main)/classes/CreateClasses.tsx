"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { classesType, classesZod } from "@/src/validation/classes.zod";
import { FormInput } from "@/components/forms/form-input";
import { createAcademicClass } from "./_actions/classes.action";

export default function CreateClasses() {
  // RHF
  const form = useForm<classesType>({
    resolver: zodResolver(classesZod),
    defaultValues: {
      name: "",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;

  // add button
  const addBtn = async (data: classesType) => {
    await handleCrudAction(createAcademicClass, data, {
      successMessage: "Class Created Successfully",
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Academic Classes
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage school years, terms, and active Classes.
          </p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* <!--  Add Classes Form --> */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Add Classes
          </h3>

          {/* add Classes form */}
          <FormProvider {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Academic Classes Name
                </Label>
                <FormInput
                  control={form.control}
                  name="name"
                  label="Class Name"
                  placeholder="Enter Class name"
                  description={form.formState.errors.name?.message}
                />
              </div>

              <Button disabled={isSubmitting} variant="default" type="submit">
                {isSubmitting ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}{" "}
                Add Classes
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
