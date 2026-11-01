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
import { examMarkTypesZod, InputExamMarkTypes } from "../_schema/exam.zod";
import { postMarkTypes } from "../_actions/exam.action";

const emptyMarkType = { name: "", status: "ACTIVE" } as InputExamMarkTypes;

/** New mark type, in a dialog — the page keeps its list visible. */
export function ExamMarkTypeDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<InputExamMarkTypes>({
    resolver: zodResolver(examMarkTypesZod),
    defaultValues: emptyMarkType,
  });
  const { isSubmitting } = form.formState;

  const addMarkType = async (data: InputExamMarkTypes) => {
    await handleCrudAction(postMarkTypes, data, {
      successMessage: "Mark type created",
      onSuccess: () => {
        router.refresh();
        form.reset(emptyMarkType);
        setOpen(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) form.reset(emptyMarkType);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          New mark type
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New mark type</DialogTitle>
          <DialogDescription>
            A paper type such as CQ, MCQ or practical. Every subject is
            configured against these.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addMarkType)}>
            <div className="space-y-4 p-5">
              <FormInput
                control={form.control}
                label="Name"
                type="text"
                name="name"
                placeholder="e.g. CQ, MCQ, PR"
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
                Save mark type
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
