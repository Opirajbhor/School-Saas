"use client";
import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { useQueryClient } from "@tanstack/react-query";
import { FormInput } from "@/components/forms/form-input";
import { adminProfileAction } from "@/src/server-actions/auth/signup.action";
import { AdminProfileInput, adminProfileZod } from "@/src/validation/auth.zod";

export default function AddTeacher() {
  const queryClient = useQueryClient();
    const {} = queryClient
  // ------------------
  const form = useForm<AdminProfileInput>({
    resolver: zodResolver(adminProfileZod),
    defaultValues: {
      gender: "MALE",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;

  // add button
  const addBtn = async (data: AdminProfileInput) => {
    await handleCrudAction(adminProfileAction, data, {
      successMessage: "Admin Created Successfully",
    });
  };

  return (
    <div>
      <h1>Step-3, Admin Profile</h1>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(addBtn)}>
          <div className="space-y-6 p-6">
            {/* bangla name */}
            <FormInput
              control={form.control}
              name="nameBangla"
              label="Bangla Name Name"
              placeholder="Enter Bangla name"
            />

            {/* english name */}
            <FormInput
              control={form.control}
              name="nameEnglish"
              label="English Name"
              placeholder="Enter English name"
            />

            {/* designation */}
            <FormInput
              control={form.control}
              name="designation"
              label="Designation"
              placeholder="e.g. Assistant Teacher, Senior Teacher"
            />

            {/* mobile */}
            <FormInput
              control={form.control}
              type="number"
              name="mobile"
              label="Mobile"
              placeholder="e.g. 017XXXXXXXX"
            />

            {/* email */}
            <FormInput
              control={form.control}
              type="email"
              name="email"
              label="E-mail"
              placeholder="e.g. name@mail.com"
            />

            {/* -----gender----- */}

            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              <label className="text-xs font-medium text-muted-foreground">
                লিঙ্গ
              </label>

              <NativeSelect
                defaultValue={form.getValues("gender")}
                {...form.register("gender")}
                className="w-full text-xs h-9"
              >
                <NativeSelectOption value="MALE">MALE</NativeSelectOption>
                <NativeSelectOption value="FEMALE">FEMALE</NativeSelectOption>
                <NativeSelectOption value="OTHER">OTHER</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>

          <Button
            disabled={isSubmitting}
            className="cursor-pointer"
            type="submit"
            size="sm"
          >
            {isSubmitting && <Spinner />} Add Teacher
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}
