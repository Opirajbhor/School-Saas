"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { requestMarkEdit } from "../../_actions/markEditRequest.action";

// A teacher uses this to ask an admin to re-open submitted marks for one
// section + subject. The request is scoped to exactly that unit.
export default function MarkEditRequestModal({
  examId,
  classId,
  sectionId,
  subjectId,
  onSuccess,
}: {
  examId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [load, setLoad] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoad(true);
    setError(null);

    const result = await requestMarkEdit({
      examId,
      classId,
      sectionId,
      subjectId,
      reason,
    });

    setLoad(false);

    if (!result.success) {
      const message =
        Object.values(result.details ?? {})[0]?.[0] ??
        String(result.error) ??
        "Failed to send request";
      setError(message);
      toast.error(message);
      return;
    }

    toast.success("Edit request sent to admin");
    setOpen(false);
    setReason("");
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <PenLine />
          Request Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request permission to edit</DialogTitle>
          <DialogDescription>
            These marks are already submitted. Explain why they need changing and
            an admin will review the request for this section and subject only.
          </DialogDescription>
        </DialogHeader>

        <FormItem>
          <FormLabel>Reason</FormLabel>
          <FormControl>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Two students' practical marks were entered under the wrong roll."
              rows={4}
            />
          </FormControl>
          <FormMessage>{error}</FormMessage>
        </FormItem>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={load || reason.trim().length < 5}
            onClick={handleSubmit}
          >
            {load && <Spinner />}
            {load ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
