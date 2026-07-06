"use client";
import TabbedUserProfile from "@/app/dashboard/profile/page";
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
import { deleteTeacher } from "@/src/server-actions/teacher.action";
import { Teacherlist } from "@/src/validation/teacher.zod";
import { AlertTriangleIcon } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { toast } from "sonner";

interface DeleteTeacherProps {
  user: Teacherlist;
  setTeachers: Dispatch<SetStateAction<Teacherlist[] | null | undefined>>;
}
export default function DeleteTeacher({
  user,
  setTeachers,
}: DeleteTeacherProps) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState(false);

  const deleteuser = async () => {
    setLoad(true);
    const result = await deleteTeacher(user.id);
    if (result.success) {
      toast.success(result.message);
      setTeachers((prev) => {
        const current = prev || [];
        return current.filter((teacher) => teacher.id !== user.id);
      });
    } else {
      toast.error(result.error);
    }
    setOpen(false);
    setLoad(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="cursor-pointer">
          <RiDeleteBin6Line />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <div className="flex items-start space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="cursor-pointer" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={load}
            className="cursor-pointer"
            variant="destructive"
            onClick={deleteuser}
          >
            {load && <Spinner />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
