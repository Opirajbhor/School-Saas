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
      division: "",
      district: "",
      upazila: "",
      eiin: "",
      institute_name_bangla: "",
      institute_name_english: "",
      admin_name_bangla: "",
      admin_name_english: "",
      admin_designation: "",
      admin_phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const onSubmit = (data: SignUpType) => {
    console.log(data);

    
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
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
        <div className="flex gap-2 items-center w-full bg-primary/25 h-10 rounded-lg p-1.5">
          <MdOutlineSchool size={25} className="text-primary" />
          <h2 className="text-primary">
            <span className=" font-bold text-primary">প্রতিষ্ঠানের তথ্য </span>
            (Institutional Information)
          </h2>
        </div>

        {/* Address */}
        <BdAddress control={form.control} setValue={form.setValue} />

        {/* EIIN------------------------- */}
        <div className="flex items-center gap-4 justify-center">
          <Field>
            <FieldLabel className="font-bold text-md">
              ইআইআইএন নাম্বার :
            </FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">
              EIIN Number
            </p>
            <Input
              type="text"
              placeholder="XXXXXX"
              required
              className=" p-4"
              {...form.register("eiin")}
            />
            <FieldDescription
              className={form.formState.errors.eiin?.message && "text-red-400"}
            >
              {form.formState.errors.eiin?.message}
            </FieldDescription>
          </Field>
          {/* -------------------- */}
          {/* Email------------------------- */}
          <Field>
            <FieldLabel className="font-bold text-md">ই-মেইল :</FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">E-mail</p>
            <Input
              type="text"
              placeholder="your@mail.com"
              required
              className=" p-4"
              {...form.register("email")}
            />
            <FieldDescription
              className={form.formState.errors.email?.message && "text-red-400"}
            >
              {form.formState.errors.email?.message}
            </FieldDescription>
          </Field>
        </div>
        {/* -------------------- */}

        {/* Institute Name Bangla------------------------- */}
        <div className="flex gap-4 items-center justify-center">
          <Field>
            <FieldLabel className=" font-bold text-md">
              শিক্ষা প্রতিষ্ঠানের নাম (বাংলায়):
            </FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">
              Institute Name
            </p>
            <Input
              type="text"
              placeholder="শিক্ষা প্রতিষ্ঠানের নাম লিখুন বাংলায়"
              required
              className=" p-4"
              {...form.register("institute_name_bangla")}
            />
            <FieldDescription
              className={
                form.formState.errors.institute_name_bangla?.message &&
                "text-red-400"
              }
            >
              {form.formState.errors.institute_name_bangla?.message
                ? form.formState.errors.institute_name_bangla?.message
                : " প্রতিষ্ঠানের নাম বাংলা অক্ষরে লিখুন"}
            </FieldDescription>
          </Field>
          {/* -------------------- */}
          {/* Institute Name English------------------------- */}
          <Field>
            <FieldLabel className=" font-bold text-md">
              শিক্ষা প্রতিষ্ঠানের নাম (ইংরেজিতে):
            </FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">
              Institute Name
            </p>
            <Input
              type="text"
              placeholder="শিক্ষা প্রতিষ্ঠানের নাম লিখুন ইংরেজিতে"
              required
              className=" p-4"
              {...form.register("institute_name_english")}
            />
            <FieldDescription
              className={
                form.formState.errors.institute_name_english?.message &&
                "text-red-400"
              }
            >
              {form.formState.errors.institute_name_english?.message
                ? form.formState.errors.institute_name_english?.message
                : "প্রতিষ্ঠানের নাম ইংরেজি বড় অক্ষরে লিখুন"}
            </FieldDescription>
          </Field>
        </div>
        {/* -------------------- */}
        {/* HeadMaster Info ------------------------- */}
        <div className="grid grid-cols-2 gap-4 items-center justify-center">
          <Field>
            <FieldLabel className=" font-bold text-md">
              প্রতিষ্ঠান প্রধানের নাম (বাংলায়):
            </FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">
              Registrant Name in Bangla
            </p>
            <Input
              type="text"
              placeholder=" নাম লিখুন বাংলায়"
              required
              className=" p-4"
              {...form.register("admin_name_bangla")}
            />
            <FieldDescription
              className={
                form.formState.errors.admin_name_bangla?.message &&
                "text-red-400"
              }
            >
              {form.formState.errors.admin_name_bangla?.message
                ? form.formState.errors.admin_name_bangla?.message
                : " প্রতিষ্ঠান প্রধানের নাম বাংলায় লিখুন"}
            </FieldDescription>
          </Field>
          {/* -------------------- */}
          {/* Head Name English------------------------- */}
          <Field>
            <FieldLabel className=" font-bold text-md">
              প্রতিষ্ঠান প্রধানের নাম (ইংরেজিতে):
            </FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">
              Institute Name in English
            </p>
            <Input
              type="text"
              placeholder="প্রতিষ্ঠানের প্রধানের নাম লিখুন ইংরেজিতে"
              required
              className=" p-4"
              {...form.register("admin_name_english")}
            />
            <FieldDescription
              className={
                form.formState.errors.admin_name_english?.message &&
                "text-red-400"
              }
            >
              {form.formState.errors.admin_name_english?.message
                ? form.formState.errors.admin_name_english?.message
                : "প্রতিষ্ঠান প্রধানের নাম ইংরেজি বড় অক্ষরে লিখুন"}
            </FieldDescription>
          </Field>
          {/* Head designation------------------------- */}
          <Field>
            <FieldLabel className=" font-bold text-md">
              প্রতিষ্ঠান প্রধানের পদবী:
            </FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">
              Registrant Designtaion
            </p>
            <Input
              type="text"
              placeholder="প্রতিষ্ঠানের প্রধানের পদবী লিখুন "
              required
              className=" p-4"
              {...form.register("admin_designation")}
            />
            <FieldDescription
              className={
                form.formState.errors.admin_designation?.message &&
                "text-red-400"
              }
            >
              {form.formState.errors.admin_designation?.message
                ? form.formState.errors.admin_designation?.message
                : "প্রতিষ্ঠান প্রধানের পদবী লিখুন"}
            </FieldDescription>
          </Field>
          {/* Head Phone------------------------- */}
          <Field>
            <FieldLabel className=" font-bold text-md">
              প্রতিষ্ঠান মোবাইল:
            </FieldLabel>
            <p className="text-muted-foreground -mt-1.25 text-[12px]">
              Institute Phone
            </p>
            <Input
              type="text"
              placeholder="প্রতিষ্ঠানের মোবাইল নম্বর লিখুন "
              required
              className=" p-4"
              max={11}
              min={11}
              {...form.register("admin_phone")}
            />
            <FieldDescription
              className={
                form.formState.errors.admin_phone?.message && "text-red-400"
              }
            >
              {form.formState.errors.admin_phone?.message
                ? form.formState.errors.admin_phone?.message
                : "প্রতিষ্ঠান মোবাইল নম্বর লিখুন"}
            </FieldDescription>
          </Field>
        </div>
        {/* -------------------- */}
        {/* password */}
        <div className="grid grid-cols-2 gap-4">
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
          {/* confirm password field--------------- */}
          <Field>
            <FieldLabel>Confirm Password</FieldLabel>
            <Input
              type="password"
              required
              className="border bg-background"
              {...form.register("confirmPassword")}
            />
            <FieldDescription>Please confirm your password.</FieldDescription>
            <FieldDescription
              className={
                form.formState.errors.confirmPassword?.message && "text-red-400"
              }
            >
              {form.formState.errors.confirmPassword?.message}
            </FieldDescription>

            {/* submit */}
          </Field>
        </div>

        <Field>
          <Button type="submit" className="cursor-pointer">
            Create Account
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
