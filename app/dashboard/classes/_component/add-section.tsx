"use client";
import { Plus } from "lucide-react";
import { useState } from "react";

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
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import {
  classesTypeWithId,
  SectionInputType,
  sectionZod,
} from "@/src/validation/classes.zod";
import { postSection } from "../_actions/classes.action";

const emptySection = (classId?: string): SectionInputType => ({
  classId: classId ?? "",
  name: "",
  sessionId: "",
  status: "ACTIVE",
});

export default function AddClassSection({
  classData,
}: {
  classData: classesTypeWithId;
}) {
  const { name, id } = classData;
  const [isOpen, setIsOpen] = useState(false);
  const [load, setLoad] = useState(false);
  const router = useRouter();

  const form = useForm<SectionInputType>({
    resolver: zodResolver(sectionZod),
    defaultValues: emptySection(id),
  });

  const submit = async (data: SectionInputType) => {
    setLoad(true);
    const res = await handleCrudAction(postSection, data, {
      successMessage: "Section created",
      onSuccess: () => {
        // The classes page is a server component, so its rows come from props
        // rather than the query cache. refresh re-renders the page so the new
        // section shows up immediately.
        router.refresh();
      },
    });
    setLoad(false);

    // dismiss only on success: a duplicate name used to close the dialog and
    // discard what had been typed
    if (res.success) {
      form.reset(emptySection(id));
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="cursor-pointer">
          <Plus />
          Section
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Add section</DialogTitle>
          <DialogDescription>
            {name} — a new section for this class.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(submit)}>
            <div className="p-5">
              <FormInput
                control={form.control}
                name="name"
                label="Section name"
                placeholder="e.g. A, B"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={load}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={load}>
                {load && <Spinner />} Save section
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
