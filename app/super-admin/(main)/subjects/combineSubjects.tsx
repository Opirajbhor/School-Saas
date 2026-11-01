"use client";

import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link as Link2 } from "@phosphor-icons/react/ssr";


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
import {
  InputCombineSubjectsType,
  OutputSubjectType,
  combineSubjectsZod,
} from "@/src/validation/subjects.zod";
import { combineSubjects } from "./_actions/subjects.action";

// Two papers (English 1st + 2nd) are combined for display only. Both stay
// ordinary subjects in the list, in subject assignment and in mark entry.
const emptyCombine: InputCombineSubjectsType = {
  firstSubjectId: "",
  secondSubjectId: "",
  label: "",
};

export default function CombineSubjects({
  subjects,
}: {
  subjects: OutputSubjectType[];
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InputCombineSubjectsType>({
    resolver: zodResolver(combineSubjectsZod),
    defaultValues: emptyCombine,
  });
  const { isSubmitting } = form.formState;

  const [firstSubjectId, secondSubjectId] = useWatch({
    control: form.control,
    name: ["firstSubjectId", "secondSubjectId"],
  });

  // a subject already in a pair cannot join another one
  const available = subjects.filter((subject) => !subject.combineWith);

  const options = available.map((subject) => ({
    label: subject.combineLabel
      ? `${subject.name} (${subject.combineLabel})`
      : subject.name,
    value: subject.id,
  }));

  const secondOptions = options.filter(
    (option) => option.value !== firstSubjectId,
  );

  // typing the shared part of both names is the common case
  const suggestLabel = () => {
    const first = subjects.find((subject) => subject.id === firstSubjectId);
    const other = subjects.find((subject) => subject.id === secondSubjectId);
    if (!first || !other) return;

    const shared: string[] = [];
    const words = first.name.split(" ");
    for (const [index, word] of words.entries()) {
      if (other.name.split(" ")[index] === word) shared.push(word);
      else break;
    }
    if (shared.length) form.setValue("label", shared.join(" "));
  };

  const addBtn = async (data: InputCombineSubjectsType) => {
    const res = await handleCrudAction(combineSubjects, data, {
      successMessage: "Subjects combined",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["default-subjects"] });
        form.reset(emptyCombine);
      },
    });

    if (res.success) setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(emptyCombine);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Link2 />
          Combine papers
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Combine two papers</DialogTitle>
          <DialogDescription>
            Marks stay paper by paper — the pair is only shown together when
            results are displayed.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBtn)}>
            <div className="space-y-4 p-5">
              <FormSelect
                control={form.control}
                name="firstSubjectId"
                label="First paper"
                placeholder="e.g. English 1st Paper"
                options={options}
                onChange={() => form.setValue("secondSubjectId", "")}
              />

              <FormSelect
                control={form.control}
                name="secondSubjectId"
                label="Second paper"
                placeholder="e.g. English 2nd Paper"
                options={secondOptions}
                onChange={suggestLabel}
              />

              <FormInput
                control={form.control}
                name="label"
                label="Combined label"
                placeholder="e.g. English"
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
                {isSubmitting && <Spinner />} Combine
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
