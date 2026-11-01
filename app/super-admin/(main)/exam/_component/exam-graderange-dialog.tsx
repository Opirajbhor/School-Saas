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
import { FormInputNumber } from "@/components/forms/form-input-number";
import { FormSelect } from "@/components/forms/form-select";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import {
  InputExamGradeRangeType,
  examGradeRangeZod,
} from "../_schema/exam.zod";
import { postGradeRange } from "../_actions/exam.action";

const emptyBand = {
  name: "",
  status: "ACTIVE",
} as InputExamGradeRangeType;

/** New grade band, in a dialog. */
export function ExamGradeRangeDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<InputExamGradeRangeType>({
    resolver: zodResolver(examGradeRangeZod),
    defaultValues: emptyBand,
  });
  const { isSubmitting } = form.formState;

  const addBand = async (data: InputExamGradeRangeType) => {
    await handleCrudAction(postGradeRange, data, {
      successMessage: "Grade band created",
      onSuccess: () => {
        router.refresh();
        form.reset(emptyBand);
        setOpen(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) form.reset(emptyBand);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          New grade band
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New grade band</DialogTitle>
          <DialogDescription>
            A mark range and the GPA it is worth. Bands must not overlap.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBand)}>
            <div className="space-y-4 p-5">
              <FormInput
                control={form.control}
                label="Grade"
                type="text"
                name="name"
                placeholder="e.g. A+, A-, B"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <FormInputNumber
                  control={form.control}
                  label="Minimum mark"
                  name="minMark"
                  placeholder="e.g. 80"
                />
                <FormInputNumber
                  control={form.control}
                  label="Maximum mark"
                  name="maxMark"
                  placeholder="e.g. 100"
                />
              </div>

              <FormInput
                control={form.control}
                label="GPA"
                name="GPA"
                placeholder="e.g. 5.00"
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
                Save band
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
