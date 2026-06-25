"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogInType, logInZod } from "@/src/validation/auth.zod";
import { loginAction } from "@/src/server-actions/login.action";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  
  const form = useForm<LogInType>({
    resolver: zodResolver(logInZod),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LogInType) => {
    try {
      const res = await loginAction(data);
      console.log(res);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <div className={cn("flex flex-col  gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your account
                </p>
              </div>
              {/* Email------------------------- */}
              <Field>
                <FieldLabel className="font-bold text-md">ই-মেইল :</FieldLabel>
                <p className="text-muted-foreground -mt-1.25 text-[12px]">
                  E-mail
                </p>
                <Input
                  type="text"
                  placeholder="আপনার ই-মেইল"
                  required
                  className=" p-4"
                  {...form.register("email")}
                />
                <FieldDescription
                  className={
                    form.formState.errors.email?.message && "text-red-400"
                  }
                >
                  {form.formState.errors.email?.message}
                </FieldDescription>
              </Field>
              {/* password------------- */}
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  required
                  className="border bg-background"
                  {...form.register("password")}
                />
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
                <FieldDescription
                  className={
                    form.formState.errors.password?.message && "text-red-400"
                  }
                >
                  {form.formState.errors.password?.message}
                </FieldDescription>
              </Field>
              <Field>
                <Button className="cursor-pointer" type="submit">
                  Login
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Don&apos;t have an account? <a href="#">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
