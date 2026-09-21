"use client";
import { Plus } from "lucide-react";
import { useState } from "react";
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
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { addTeacherType, addTeacherZod } from "@/src/validation/teacher.zod";
import { FieldDescription } from "@/components/ui/field";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { addTeacher } from "@/src/server-actions/teacher.action";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { useQueryClient } from "@tanstack/react-query";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";

export default function AddTeacher() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // ------------------
  const form = useForm<addTeacherType>({
    resolver: zodResolver(addTeacherZod),
    defaultValues: {
      gender: "MALE",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;

  // add button
  const addBtn = async (data: addTeacherType) => {
    await handleCrudAction(addTeacher, data, {
      successMessage: "Teacher Created Successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["teachers"],
        });
        form.reset();
      },
    });
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
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBtn)}>
            <div className="space-y-6 p-6">
              {/* bangla name */}
              <FormInput
                control={form.control}
                name="nameBangla"
                label="Bangla Name Name"
                placeholder="Enter Bangla name"
              />

              {/* english name */}
              <FormInput
                control={form.control}
                name="nameEnglish"
                label="English Name"
                placeholder="Enter English name"
              />

              {/* designation */}
              <FormInput
                control={form.control}
                name="designation"
                label="Designation"
                placeholder="e.g. Assistant Teacher, Senior Teacher"
              />

              {/* mobile */}
              <FormInput
                control={form.control}
                type="number"
                name="mobile"
                label="Mobile"
                placeholder="e.g. 017XXXXXXXX"
              />

              {/* email */}
              <FormInput
                control={form.control}
                type="email"
                name="email"
                label="E-mail"
                placeholder="e.g. name@mail.com"
              />

              {/* -----gender----- */}

              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                <label className="text-xs font-medium text-muted-foreground">
                  লিঙ্গ
                </label>

                <NativeSelect
                  defaultValue={form.getValues("gender")}
                  {...form.register("gender")}
                  className="w-full text-xs h-9"
                >
                  <NativeSelectOption value="MALE">MALE</NativeSelectOption>
                  <NativeSelectOption value="FEMALE">FEMALE</NativeSelectOption>
                  <NativeSelectOption value="OTHER">OTHER</NativeSelectOption>
                </NativeSelect>
              </div>
              {/* PASSWORD */}
              <FormInput
                control={form.control}
                name="password"
                label="Password"
                placeholder="e.g. Minimum 8 characters long"
              />
              {/* Confirm PASSWORD */}
              <FormInput
                control={form.control}
                name="confirmPassword"
                label="Confirm Password"
                placeholder="e.g. Minimum 8 characters long"
              />
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
