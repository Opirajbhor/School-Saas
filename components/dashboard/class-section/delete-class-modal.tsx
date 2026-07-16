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
import { deleteClass } from "@/src/server-actions/classes.action";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import { AlertTriangleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ClassDeleteModal({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(false);

  const handleclick = async () => {
    setLoad(true);
    try {
      const res = await deleteClass(classId);
      if (res.success) {
        toast.success("Class Deleted Succesfully");
      }
    } catch (error) {
      toast.error("Error Deleting Class");
      console.error(error);
    } finally {
      setOpen(false);
      setLoad(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="destructive">
          Delete Class Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <div className="flex items-start space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle>Delete Class Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete? your data will be permanently
              removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={load} onClick={handleclick} variant="destructive">
            {load && <Spinner />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
