"use client";
import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { useQueryClient } from "@tanstack/react-query";
import { FormInput } from "@/components/forms/form-input";
import { adminProfileAction } from "@/src/server-actions/auth/signup.action";
import { AdminProfileInput, adminProfileZod } from "@/src/validation/auth.zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/src/better-auth/auth-client";
import { FormSelect } from "@/components/forms/form-select";

export default function AdminProfilePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  useEffect(() => {
    if (session?.user.role === "user") {
      router.push("/dashboard");
    }
  }, [session, router]);
  const queryClient = useQueryClient();
  const {} = queryClient;
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
      onSuccess: () => {
        router.push("/dashboard");
      },
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

            <FormSelect
              control={form.control}
              name="designation"
              label="Designation"
              options={[
                { label: "PRINCIPAL", value: "PRINCIPAL" },
                { label: "HEADMASTER", value: "HEADMASTER" },
                {
                  label: "ASSISTANT HEADMASTER",
                  value: "ASSISTANT HEADMASTER",
                },
                { label: "ASSISTANT TEACHER", value: "ASSISTANT TEACHER" },
              ]}
              description={form.formState.errors.gender?.message}
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
            <FormSelect
              control={form.control}
              name="gender"
              label="Gender"
              options={[
                { label: "MALE", value: "MALE" },
                { label: "FEMALE", value: "FEMALE" },
                { label: "OTHER", value: "OTHER" },
              ]}
              description={form.formState.errors.gender?.message}
            />
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
