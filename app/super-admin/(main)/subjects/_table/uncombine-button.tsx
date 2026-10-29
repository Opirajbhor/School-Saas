"use client";
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
import { Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { uncombineSubject } from "../_actions/subjects.action";

// Splits a combined pair back into two independent subjects. Reversible, so it
// needs a confirm dialog but not a destructive one.
export function UncombineButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(false);
  const router = useRouter();

  const handleUncombine = async () => {
    setLoad(true);
    try {
      const result = await uncombineSubject({ subjectId: id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Subjects separated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Error separating subjects");
      console.error(error);
    } finally {
      setOpen(false);
      setLoad(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" title={`Separate ${label}`}>
          <Unlink className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <div className="flex items-start space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Unlink className="h-6 w-6 text-muted-foreground" />
          </div>
          <DialogHeader>
            <DialogTitle>Separate {label}</DialogTitle>
            <DialogDescription>
              Both papers become independent subjects again. Marks are not
              affected.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={load} onClick={handleUncombine} variant="default">
            {load && <Spinner />} {load ? "Separating..." : "Separate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
