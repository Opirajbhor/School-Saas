"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { adminProfileAction } from "@/src/server-actions/auth/signup.action";
import {
  AdminProfileInput,
  adminProfileZod,
} from "@/src/validation/auth.zod";
import { authClient } from "@/src/better-auth/auth-client";

const DESIGNATIONS = [
  "HEADMASTER",
  "PRINCIPAL",
  "ASSISTANT HEADMASTER",
  "ASSISTANT TEACHER",
] as const;

export default function AdminProfilePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user.role === "user") router.push("/dashboard");
  }, [session, router]);

  const form = useForm<AdminProfileInput>({
    resolver: zodResolver(adminProfileZod),
    defaultValues: {
      gender: "MALE",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;

  const addBtn = async (data: AdminProfileInput) => {
    await handleCrudAction(adminProfileAction, data, {
      successMessage: "Institute setup complete",
      onSuccess: () => {
        router.push("/dashboard");
      },
    });
  };

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Step 3 of 3
          </span>
          <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
            Admin profile
          </h1>
          <p className="text-sm text-muted-foreground">
            The person responsible for this institute. You can edit it later from
            settings.
          </p>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBtn)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="nameEnglish"
                label="Name (English)"
                placeholder="e.g. Md. Kamruzzaman"
                autoFocus
              />
              <FormInput
                control={form.control}
                name="nameBangla"
                label="Name (Bangla)"
                placeholder="নাম"
              />

              <FormSelect
                control={form.control}
                name="designation"
                label="Designation"
                options={DESIGNATIONS.map((value) => ({
                  label: value
                    .toLowerCase()
                    .replace(/(^|\s)\S/g, (c) => c.toUpperCase()),
                  value,
                }))}
              />

              <FormSelect
                control={form.control}
                name="gender"
                label="Gender"
                options={[
                  { label: "Male", value: "MALE" },
                  { label: "Female", value: "FEMALE" },
                  { label: "Other", value: "OTHER" },
                ]}
              />

              {/* tel, not number — a BD mobile starts with 0 */}
              <FormInput
                control={form.control}
                name="mobile"
                label="Mobile"
                type="tel"
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
                maxLength={11}
              />

              <FormInput
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="name@school.edu.bd"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Finish setup
            </Button>
          </form>
        </FormProvider>
      </div>
    </AuthShell>
  );
}
