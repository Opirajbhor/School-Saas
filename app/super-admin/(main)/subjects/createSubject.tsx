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
import {
  InputSubjectType,
  inputSubjectZod,
} from "@/src/validation/subjects.zod";
import { createAcademicsubjects } from "./_actions/subjects.action";

// A subject row stores only its identity (name / code / short name). Whether it
// is compulsory, group-based or religious is decided per class when the subject
// is assigned, and lives on subject_assignments.
const emptySubject: InputSubjectType = {
  name: "",
  code: "",
  shortName: "",
  status: "ACTIVE",
};

export default function CreateSubject() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InputSubjectType>({
    resolver: zodResolver(inputSubjectZod),
    defaultValues: emptySubject,
  });
  const { isSubmitting } = form.formState;

  const addBtn = async (data: InputSubjectType) => {
    const res = await handleCrudAction(createAcademicsubjects, data, {
      successMessage: "Subject created",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["default-subjects"] });
        form.reset(emptySubject);
      },
    });

    if (res.success) setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(emptySubject);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Plus />
          New subject
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New subject</DialogTitle>
          <DialogDescription>
            Platform-wide, offered to every institute. Compulsory or optional is
            decided per class later.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBtn)}>
            <div className="space-y-4 p-5">
              <FormInput
                control={form.control}
                name="name"
                label="Subject name"
                placeholder="e.g. Bangla 1st Paper"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  control={form.control}
                  name="code"
                  label="Code"
                  placeholder="e.g. BAN1"
                />
                <FormInput
                  control={form.control}
                  name="shortName"
                  label="Short name"
                  placeholder="e.g. Bangla 1st"
                />
              </div>
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
                {isSubmitting && <Spinner />} Create subject
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
