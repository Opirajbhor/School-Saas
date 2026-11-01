"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FcEmptyTrash as Trash } from "react-icons/fc";

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
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { unassignSubject } from "../_actions/subjects.action";

/** Removes one class↔subject pair after a confirm step. */
export function UnassignButton({
  classId,
  subjectId,
  subjectName,
  className,
}: {
  classId: string;
  subjectId: string;
  subjectName: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const remove = async () => {
    setLoading(true);
    const res = await handleCrudAction(
      unassignSubject,
      { classId, subjectId },
      {
        successMessage: "Subject removed from the class",
        onSuccess: () => router.refresh(),
      },
    );
    setLoading(false);
    if (res.success) setOpen(false);
    else toast.error("Could not remove the subject");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${subjectName} from ${className}`}
          className="cursor-pointer"
        >
          <Trash />
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Remove subject</DialogTitle>
          <DialogDescription>
            {subjectName} will no longer be assigned to {className}. Marks
            already entered are not deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 p-4">
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={remove}
            disabled={loading}
          >
            {loading && <Spinner />} Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
