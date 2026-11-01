"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { addGroupZod, inputGroupType } from "@/src/validation/groups.zod";
import { createAcademicGroups } from "./_actions/groups.action";

const emptyGroup: inputGroupType = { name: "", status: "ACTIVE" };

export default function CreateGroups() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<inputGroupType>({
    resolver: zodResolver(addGroupZod),
    defaultValues: emptyGroup,
  });
  const { isSubmitting } = form.formState;

  const addBtn = async (data: inputGroupType) => {
    const res = await handleCrudAction(createAcademicGroups, data, {
      successMessage: "Group created",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["default-groups"] });
        form.reset(emptyGroup);
      },
    });

    if (res.success) setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(emptyGroup);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Plus />
          New group
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New academic group</DialogTitle>
          <DialogDescription>
            A platform-wide stream such as Science or Business Studies. Assign it
            to classes afterwards.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBtn)}>
            <div className="p-5">
              <FormInput
                control={form.control}
                name="name"
                label="Group name"
                placeholder="e.g. Science"
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
                {isSubmitting && <Spinner />} Create group
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
