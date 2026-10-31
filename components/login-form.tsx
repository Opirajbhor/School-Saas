"use client";

import { useState } from "react";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormInput } from "@/components/forms/form-input";
import { LogInType, logInZod } from "@/src/validation/auth.zod";
import { loginAction } from "@/src/server-actions/auth/login.action";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LogInType>({
    resolver: zodResolver(logInZod),
    defaultValues: { email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LogInType) => {
    const result = await loginAction(data);

    // success redirects on the server, so reaching here means it did not work
    if (result && result.success === false) {
      toast.error("Could not sign in", {
        description: result.error ?? "Check your email and password.",
      });
      return;
    }

    toast.error("Could not sign in", {
      description: "Check your email and password.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Use the account that owns your institute.
        </p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="you@school.edu.bd"
            autoComplete="email"
            autoFocus
          />

          {/* password needs an inline reveal toggle, which FormInput has no slot
              for, so it is built here */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Sign in
          </Button>
        </form>
      </FormProvider>

      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          href="/auth/onboarding/signup"
          className="font-medium text-foreground hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
