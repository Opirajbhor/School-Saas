"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

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
import { authClient } from "@/src/better-auth/auth-client";

// mirrors the signup rule so a password that passes here would also have been
// accepted at sign-up
const passwordZod = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .max(100, "Password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        "Needs an uppercase letter, a lowercase letter and a number",
      ),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordZod>;

const emptyForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordZod),
    defaultValues: emptyForm,
  });

  const { isSubmitting } = form.formState;

  const submit = async (values: PasswordForm) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      // anything signed in with the old password is signed out
      revokeOtherSessions: true,
    });

    if (error) {
      // better-auth returns INVALID_PASSWORD when the current one is wrong; put
      // it on the field the user has to fix instead of only in a toast
      form.setError("currentPassword", {
        message: error.message ?? "Could not change the password",
      });
      toast.error("Password not changed", {
        description: error.message ?? "Could not change the password.",
      });
      return;
    }

    toast.success("Password updated", {
      description: "Other devices were signed out.",
    });
    form.reset(emptyForm);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(emptyForm);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <KeyRound />
          Change password
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Every other device signed in with the old password is signed out.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(submit)}>
            <div className="space-y-4 p-5">
              <FormInput
                control={form.control}
                name="currentPassword"
                label="Current password"
                type="password"
                autoComplete="current-password"
                autoFocus
              />
              <FormInput
                control={form.control}
                name="newPassword"
                label="New password"
                type="password"
                autoComplete="new-password"
              />
              <FormInput
                control={form.control}
                name="confirmPassword"
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting && <Spinner />} Update password
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
