"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormInput } from "@/components/forms/form-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SignUpType, signUpZod } from "@/src/validation/auth.zod";
import { signUpAction } from "@/src/server-actions/auth/signup.action";
import { authClient } from "@/src/better-auth/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const form = useForm<SignUpType>({
    resolver: zodResolver(signUpZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;

  // this used to run during render, i.e. on every keystroke
  const token = session?.session?.token;
  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  const handleCreate = async (data: SignUpType) => {
    const result = await signUpAction(data);

    // success redirects to the institute step on the server
    if (result && result.success === false) {
      toast.error("Could not create the account", {
        description: result.error ?? "That email may already be in use.",
      });
    }
  };

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Step 1 of 3
          </span>
          <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Next you&apos;ll add the institute and the admin profile.
          </p>
        </div>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreate)}
            className="space-y-4"
          >
            <FormInput
              control={form.control}
              name="name"
              label="Full name"
              placeholder="e.g. Md. Karim"
              autoComplete="name"
              autoFocus
            />

            <FormInput
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="you@school.edu.bd"
              autoComplete="email"
            />

            {/* type="password" was missing, so both password fields echoed the
                secret back in plain text */}
            <FormInput
              control={form.control}
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              description="8+ characters with an uppercase letter, a lowercase letter and a number."
            />

            <FormInput
              control={form.control}
              name="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Create account
            </Button>
          </form>
        </FormProvider>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
