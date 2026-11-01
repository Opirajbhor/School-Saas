"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IoAddOutline as Plus } from "react-icons/io5";

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
import { FormSelect } from "@/components/forms/form-select";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { examZod, InputExamType } from "@/app/dashboard/exam/_schema/exam.zod";
import { postExams } from "../_actions/exam.action";

const emptyExam: InputExamType = { name: "", status: "ACTIVE" } as InputExamType;

/** "New exam" button + the create form in a dialog. */
export function ExamCreateDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<InputExamType>({
    resolver: zodResolver(examZod),
    defaultValues: emptyExam,
  });
  const { isSubmitting } = form.formState;

  const addExam = async (data: InputExamType) => {
    const res = await handleCrudAction(postExams, data, {
      successMessage: "Exam created",
      onSuccess: () => {
        // the list is server-rendered
        router.refresh();
        form.reset(emptyExam);
        setOpen(false);
      },
    });

    if (!res.success) {
      setOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) form.reset(emptyExam);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          New exam
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New exam</DialogTitle>
          <DialogDescription>
            Creates a platform paper. Assign it to classes afterwards.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addExam)}>
            <div className="space-y-4 p-5">
              <FormInput
                control={form.control}
                label="Exam name"
                type="text"
                name="name"
                placeholder="e.g. Half-Yearly, Annual"
                autoFocus
              />

              <FormSelect
                control={form.control}
                name="status"
                label="Status"
                options={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                ]}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting && <Spinner />}
                Save exam
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
