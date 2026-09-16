"use client";
import { PiShieldChevronBold } from "react-icons/pi";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { SignUpType, signUpZod } from "@/src/validation/auth.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/forms/form-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { signUpAction } from "@/src/server-actions/signup.action";
import { authClient } from "@/src/better-auth/auth-client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  if (session?.session.token) router.push("/dashboard");

  const form = useForm<SignUpType>({
    resolver: zodResolver(signUpZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;

  const handleCreate = async (data: SignUpType) => {
    await signUpAction(data);
  };

  return (
    <div className="flex flex-col p-6">
      {/* Logo */}
      <div className="flex justify-center gap-2 md:justify-start">
        <Link
          href="/"
          aria-label="home"
          className="flex gap-1 items-center space-x-2"
        >
          <PiShieldChevronBold size={30} />
          Educare
        </Link>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p>Step-01</p>

        <h1 className="text-2xl font-bold">
          আপনার প্রতিষ্ঠানটি এখনই যুক্ত করুন
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Fill in the form below to create your account
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-lvh">
          <FormProvider {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleCreate)}
            >
              {/* ------- userName ----------- */}
              <FormInput
                control={form.control}
                label="User Name"
                name="name"
                placeholder="e.g., Karim"
              />
              {/*----------- email -----------*/}
              <FormInput
                control={form.control}
                label="Enter Your E-mail"
                name="email"
                type="email"
                placeholder="e.g., yourname@email.com"
              />

              {/*---------- password -----------*/}
              <FormInput
                control={form.control}
                label="Password"
                name="password"
                placeholder=""
              />
              {/*---------- confirm password -----------*/}
              <FormInput
                control={form.control}
                label="Confirm Password"
                name="confirmPassword"
                placeholder=""
              />

              {/* -------submit button------------- */}
              <Button disabled={isSubmitting} variant="default" type="submit">
                {isSubmitting ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Account
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
