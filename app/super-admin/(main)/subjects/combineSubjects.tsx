"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";

import {
  InputCombineSubjectsType,
  OutputSubjectType,
  combineSubjectsZod,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as LinkIcon } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { combineSubjects } from "./_actions/subjects.action";

// Two papers (English 1st + 2nd) are combined for display only. Both stay
// ordinary subjects in the list, in subject assignment and in mark entry.
export default function CombineSubjects({
  subjects,
}: {
  subjects: OutputSubjectType[];
}) {
  const form = useForm<InputCombineSubjectsType>({
    resolver: zodResolver(combineSubjectsZod),
    defaultValues: {
      firstSubjectId: "",
      secondSubjectId: "",
      label: "",
    },
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
    await handleCrudAction(combineSubjects, data, {
      successMessage: "Subjects Combined Successfully",
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
          Combine Two Papers
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Marks are still entered paper by paper. The pair is only shown
          together when marks are displayed.
        </p>

        <FormProvider {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            <FormSelect
              control={form.control}
              name="firstSubjectId"
              label="First Paper"
              placeholder="e.g., English 1st Paper"
              options={options}
              onChange={() => form.setValue("secondSubjectId", "")}
            />

            <FormSelect
              control={form.control}
              name="secondSubjectId"
              label="Second Paper"
              placeholder="e.g., English 2nd Paper"
              options={secondOptions}
              onChange={suggestLabel}
            />

            <FormInput
              control={form.control}
              name="label"
              label="Combined Label"
              placeholder="e.g., English"
            />

            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              Combine Subjects
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
