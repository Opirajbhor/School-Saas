"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShieldCheck as Shield } from "@phosphor-icons/react/ssr";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormInput } from "@/components/forms/form-input";
import {
  createSuperAdminZod,
  CreateSuperAdminInput,
} from "@/src/validation/superadmin.zod";
import {
  createSuperAdminAction,
  promoteToSuperAdmin,
} from "./_actions/superadmin.action";
import { toast } from "sonner";

const emptyAdmin: CreateSuperAdminInput = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

/** Brand new superadmin account. */
export function NewSuperAdminDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<CreateSuperAdminInput>({
    resolver: zodResolver(createSuperAdminZod),
    defaultValues: emptyAdmin,
  });
  const { isSubmitting } = form.formState;

  const create = async (data: CreateSuperAdminInput) => {
    const res = await createSuperAdminAction(data);
    if (!res.success) {
      toast.error(
        Object.values(res.details ?? {})[0]?.[0] ??
          res.error ??
          "Failed to create superadmin",
      );
      return;
    }

    toast.success("Superadmin created");
    form.reset(emptyAdmin);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) form.reset(emptyAdmin);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          New superadmin
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New superadmin</DialogTitle>
          <DialogDescription>
            Full access to every institute, platform defaults and billing.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(create)}>
            <div className="space-y-3.5 p-5">
              <FormInput
                control={form.control}
                name="name"
                label="Full name"
                placeholder="Enter full name"
                autoFocus
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
                label="Temporary password"
                placeholder="At least 8 characters"
                description="Uppercase, lowercase and a number. Share it securely and ask them to change it after signing in."
              />
              <FormInput
                control={form.control}
                name="confirmPassword"
                type="password"
                label="Confirm password"
                placeholder="Repeat the password"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting && <Spinner />}
                Create
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

/** Give an existing account platform access. */
export function PromoteSuperAdminDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<{ email: string }>({ defaultValues: { email: "" } });
  const { isSubmitting } = form.formState;

  const promote = async (data: { email: string }) => {
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
    form.reset({ email: "" });
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) form.reset({ email: "" });
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Shield />
          Promote existing
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Promote an account</DialogTitle>
          <DialogDescription>
            Give an email that already exists in the system platform access.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(promote)}>
            <div className="p-5">
              <FormInput
                control={form.control}
                name="email"
                type="email"
                label="Account email"
                placeholder="name@example.com"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting && <Spinner />}
                Promote
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
