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
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { postSection } from "@/src/server-actions/classes.action";
import {
  classesTypeWithId,
  SectionInputType,
  sectionType,
  sectionZod,
} from "@/src/validation/classes.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
export default function AddClassSection({
  classData,
}: {
  classData: classesTypeWithId;
}) {
  const { name, id } = classData;
  const [load, setLoad] = useState(false);
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<SectionInputType>({
    resolver: zodResolver(sectionZod),
    defaultValues: {
      classId: id,
    },
  });
  const addBtn = async (data: SectionInputType) => {
    setLoad(true);
    await handleCrudAction(postSection, data, {
      successMessage: "Section Created Succesfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["classes", "sections"],
        });
      },
    });

    setIsOpen(false);
    setLoad(false);
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
