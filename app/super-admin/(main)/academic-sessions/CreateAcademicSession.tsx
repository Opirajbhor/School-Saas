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
import {
  academicSessionType,
  academicSessionZod,
} from "@/src/validation/academicSessions.zod";
import { createAcademicSession } from "./_actions/academicSession.action";

const emptySession: academicSessionType = { year: "", status: "ACTIVE" };

export default function CreateAcademicSession() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<academicSessionType>({
    resolver: zodResolver(academicSessionZod),
    defaultValues: emptySession,
  });
  const { isSubmitting } = form.formState;

  const addBtn = async (data: academicSessionType) => {
    const res = await handleCrudAction(createAcademicSession, data, {
      successMessage: "Session created",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        form.reset(emptySession);
      },
    });

    if (res.success) setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(emptySession);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Plus />
          New session
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>New academic session</DialogTitle>
          <DialogDescription>
            One year, e.g. 2027. Institutes enrol students into whichever year is
            active.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(addBtn)}>
            <div className="p-5">
              <FormInput
                control={form.control}
                name="year"
                label="Session year"
                placeholder="2027"
                inputMode="numeric"
                maxLength={4}
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
                {isSubmitting && <Spinner />} Create session
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
