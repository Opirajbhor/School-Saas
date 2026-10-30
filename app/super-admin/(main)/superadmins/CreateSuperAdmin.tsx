"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { FormInput } from "@/components/forms/form-input";
import { toast } from "sonner";
import {
  createSuperAdminZod,
  CreateSuperAdminInput,
} from "@/src/validation/superadmin.zod";
import {
  createSuperAdminAction,
  promoteToSuperAdmin,
} from "./_actions/superadmin.action";

export default function CreateSuperAdmin() {
  const queryClient = useQueryClient();

  // create a brand new account
  const form = useForm<CreateSuperAdminInput>({
    resolver: zodResolver(createSuperAdminZod),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { isSubmitting } = form.formState;

  const addBtn = async (data: CreateSuperAdminInput) => {
    const res = await createSuperAdminAction(data);
    if (!res.success) {
      toast.error(
        Object.values(res.details ?? {})[0]?.[0] ??
          res.error ??
          "Failed to create superadmin",
      );
      return;
    }
    toast.success("Superadmin created successfully");
    form.reset();
    queryClient.invalidateQueries({ queryKey: ["superadmins"] });
  };

  // promote someone who already has an account
  const promoteForm = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });
  const { isSubmitting: isPromoting } = promoteForm.formState;

  const promoteBtn = async (data: { email: string }) => {
    const res = await promoteToSuperAdmin(data);
    if (!res.success) {
      toast.error(
        Object.values(res.details ?? {})[0]?.[0] ??
          res.error ??
          "Failed to promote user",
      );
      return;
    }
    toast.success("User promoted to superadmin");
    promoteForm.reset();
    queryClient.invalidateQueries({ queryKey: ["superadmins"] });
  };

  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Super Admins
          </h2>
          <p className="text-lg text-muted-foreground">
            Grant or remove platform-wide superadmin access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* <!-- Add a new superadmin --> */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Create New Superadmin
          </h3>

          <FormProvider {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
              <FormInput
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="Enter full name"
              />
              <FormInput
                control={form.control}
                name="email"
                type="email"
                label="Email"
                placeholder="name@example.com"
              />
              <FormInput
                control={form.control}
                name="password"
                type="password"
                label="Temporary Password"
                placeholder="At least 8 characters"
                description="Must contain uppercase, lowercase and a number. Share it securely and ask them to change it after signing in."
              />
              <FormInput
                control={form.control}
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Repeat the password"
              />

              <Button disabled={isSubmitting} variant="default" type="submit">
                {isSubmitting ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}{" "}
                Create Superadmin
              </Button>
            </form>
          </FormProvider>
        </div>

        {/* <!-- Promote an existing account --> */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Promote Existing User
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Give an account that already exists in the system superadmin access.
          </p>

          <FormProvider {...promoteForm}>
            <form
              className="space-y-4"
              onSubmit={promoteForm.handleSubmit(promoteBtn)}
            >
              <FormInput
                control={promoteForm.control}
                name="email"
                type="email"
                label="Account Email"
                placeholder="name@example.com"
              />
              <Button disabled={isPromoting} variant="outline" type="submit">
                {isPromoting ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}{" "}
                Promote to Superadmin
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
