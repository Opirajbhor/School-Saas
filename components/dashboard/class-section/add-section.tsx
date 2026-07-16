"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { postSection } from "@/src/server-actions/classes.action";
import {
  classesTypeWithId,
  sectionType,
  sectionZod,
} from "@/src/validation/classes.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
export default function AddClassSection({
  classData,
}: {
  classData: classesTypeWithId;
}) {
  const { name, id } = classData;
  const [load, setLoad] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<sectionType>({
    resolver: zodResolver(sectionZod),
    defaultValues: {
      instituteId: "",
      userId: "",
      sessionId: "",
      classId: id,
      name: "",
    },
  });
  const addBtn = async (data: sectionType) => {
    setLoad(true);
    try {
      const res = await postSection(data);
      if (res.success) {
        toast.success("Section Created Succesfully");
      }
    } catch (error) {
      toast.error("Error Creating Section");
      console.error(error);
    } finally {
      setIsOpen(false);
      setLoad(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-center w-full">
        <DialogTrigger asChild>
          <Button className="w-full mb-3">Add Section</Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Section to -
            <span className="text-primary font-bold">{name}</span>
          </DialogTitle>
          <DialogDescription>
            Create Section to this Class. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(addBtn)}>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Section Name
            </Label>
            <Input
              {...form.register("name")}
              type="text"
              placeholder="eg: A, B"
              className="mb-5"
            />
          </div>
          <DialogFooter>
            <Button disabled={load} type="submit" className="w-full">
              {load && <Spinner />} Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
