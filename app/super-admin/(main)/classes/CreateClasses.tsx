"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react/ssr";


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
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { classesType, classesZod } from "@/src/validation/classes.zod";
import { createAcademicClass } from "./_actions/classes.action";

const emptyClass: classesType = { name: "", status: "ACTIVE" };

export default function CreateClasses() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<classesType>({
    resolver: zodResolver(classesZod),
    defaultValues: emptyClass,
  });
  const { isSubmitting } = form.formState;

  const addBtn = async (data: classesType) => {
    const res = await handleCrudAction(createAcademicClass, data, {
      successMessage: "Class created",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["default-classes"] });
        form.reset(emptyClass);
      },
    });

    if (res.success) setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(emptyClass);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Plus />
          New class
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New class</DialogTitle>
          <DialogDescription>
            A platform-wide class every institute inherits, e.g. Class 10.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBtn)}>
            <div className="p-5">
              <FormInput
                control={form.control}
                name="name"
                label="Class name"
                placeholder="e.g. Class 10"
                autoFocus
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
                {isSubmitting && <Spinner />} Create class
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
