"use client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getInstituteProfile } from "@/src/server-actions/getInstitituteProfile.action";
import { ProfileType } from "@/src/validation/auth.zod";
import { addTeacherType, addTeacherZod } from "@/src/validation/teacher.zod";
import { FieldDescription } from "@/components/ui/field";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { addTeacher } from "@/src/server-actions/teacher.action";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function AddTeacher() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileType | null>(null);

  //   get institute info
  useEffect(() => {
    async function getProfile() {
      try {
        const info = await getInstituteProfile();
        if (!info) {
          setProfile(null);
        }
        setProfile(info);
      } catch (error) {
        console.error(error);
      }
    }
    getProfile();
  }, []);
  // ------------------
  const form = useForm<addTeacherType>({
    resolver: zodResolver(addTeacherZod),
    defaultValues: {
      instituteId: "",
      nameBangla: "",
      nameEnglish: "",
      designation: "",
      mobile: "",
      email: "",
      photoUrl: "",
      gender: "MALE",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;
  const addBtn = async (data: addTeacherType) => {
    const res = await addTeacher(data);
    if (res.success === false) {
      // If backend Zod validation failed, grab the first specific error message
      if (res.details) {
        const firstErrorField = Object.keys(res.details)[0];
        const messages =
          res.details[firstErrorField as keyof typeof res.details];
        if (messages && messages.length > 0) {
          toast.error(messages[0]);
          return;
        }
      }

      // Fallback error fallback message
      toast.error(res.error || "An unexpected error occurred.");
      return;
    }
    // Handle successful execution path
    if (res.success === true) {
      toast.success("Teacher added successfully");
      form.reset(); // Wipes form states cleanly
    }
    console.log("raw data-", data);
    console.log("res data-", res.data);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 px-3 text-xs bg-primary cursor-pointer"
        >
          <Plus />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="p-0 sm:max-w-lg gap-0"
      >
        <DialogHeader className="border-b px-6 py-4 pt-5">
          <DialogTitle>শিক্ষক যুক্ত করুন</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(addBtn)}>
          <div className="space-y-6 p-6">
            {/* bangla name */}
            <div className="space-y-2">
              <Label>নাম: (বাংলায়)</Label>
              <Input
                {...form.register("nameBangla")}
                placeholder="নাম বাংলায়"
              />
              <FieldDescription
                className={
                  form.formState.errors.nameBangla?.message && "text-red-400"
                }
              >
                {form.formState.errors.nameBangla?.message}
              </FieldDescription>
            </div>
            {/* english name */}
            <div className="space-y-2">
              <Label> নাম: (ইংরেজিতে)</Label>
              <Input
                {...form.register("nameEnglish")}
                placeholder="নাম ইংরেজিতে"
              />
              <FieldDescription
                className={
                  form.formState.errors.nameEnglish?.message && "text-red-400"
                }
              >
                {form.formState.errors.nameEnglish?.message}
              </FieldDescription>
            </div>
            {/* designation */}
            <div className="space-y-2">
              <Label>পদবী</Label>
              <Input {...form.register("designation")} placeholder="পদবী" />
              <FieldDescription
                className={
                  form.formState.errors.designation?.message && "text-red-400"
                }
              >
                {form.formState.errors.designation?.message}
              </FieldDescription>
            </div>
            {/* mobile */}
            <div className="space-y-2">
              <Label> মোবাইল নম্বর</Label>
              <Input {...form.register("mobile")} placeholder="মোবাইল নম্বর" />
              <FieldDescription
                className={
                  form.formState.errors.mobile?.message && "text-red-400"
                }
              >
                {form.formState.errors.mobile?.message}
              </FieldDescription>
            </div>
            {/* email */}
            <div className="space-y-2">
              <Label> ই-মেইল</Label>
              <Input {...form.register("email")} placeholder="ই-মেইল" />
              <FieldDescription
                className={
                  form.formState.errors.email?.message && "text-red-400"
                }
              >
                {form.formState.errors.email?.message}
              </FieldDescription>
            </div>
            {/* ---------------------gender */}
            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              <label className="text-xs font-medium text-muted-foreground">
                লিঙ্গ
              </label>

              <NativeSelect
                defaultValue={form.getValues("gender")}
                {...form.register("gender")}
                className="w-full text-xs h-9"
              >
                <NativeSelectOption value="MALE">পুরুষ</NativeSelectOption>
                <NativeSelectOption value="FEMALE">মহিলা</NativeSelectOption>
                <NativeSelectOption value="OTHER">অন্যান্য</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>

          <div className="flex items-center justify-end border-t p-4 space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={isSubmitting}
              className="cursor-pointer"
              type="submit"
              size="sm"
            >
              {isSubmitting && <Spinner />} Add Teacher
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
