"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { SignUpType, signUpZod } from "@/src/validation/auth.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdOutlineSchool } from "react-icons/md";
import BdAddress from "@/components/bd-address/bd-address";
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const form = useForm<SignUpType>({
    resolver: zodResolver(signUpZod),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            আপনার প্রতিষ্ঠানটি এখনই যুক্ত করুন
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>

        {/* institute profile------------------------------ */}
        <div className="flex gap-2 items-center">
          <MdOutlineSchool size={25} className="text-primary" />
          <h2 className="text-primary">
            <span className=" font-bold text-primary">প্রতিষ্ঠানের তথ্য </span>
            (Institutional Information)
          </h2>
        </div>

        {/* Address */}
        <BdAddress />

        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background"
          />
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            className="bg-background"
          />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            required
            className="bg-background"
          />
          <FieldDescription>Please confirm your password.</FieldDescription>
        </Field>
        <Field>
          <Button type="submit" className="cursor-pointer">
            Create Account
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
