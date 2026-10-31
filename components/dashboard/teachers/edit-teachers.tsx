"use client";
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
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pen } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormInput } from "@/components/forms/form-input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { editTeacherType, editTeacherZod } from "@/src/validation/teacher.zod";
import { editTeacher } from "@/app/dashboard/teachers/_actions/teacher.action";
import { DeleteTeacherProps } from "./delete-teacher";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Same dialog shape as AddTeacher: header with a hairline, scrolling body,
// pinned footer. It was a right-hand Sheet, which is wrong for a small edit
// form — the panel covered the table the user was editing from.
export default function EditTeachers({ user }: DeleteTeacherProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<editTeacherType>({
    resolver: zodResolver(editTeacherZod),
    defaultValues: {
      id: user.id,
      nameBangla: user.nameBangla,
      nameEnglish: user.nameEnglish,
      designation: user.designation,
      mobile: user.mobile,
      email: user.email,
      photoUrl: user.photoUrl ?? "",
      gender: user.gender as "MALE" | "FEMALE" | "OTHER",
      status: user.status as "ACTIVE" | "INACTIVE",
    },
  });
  const { isSubmitting } = form.formState;

  const submit = async (data: editTeacherType) => {
    const res = await editTeacher(data.id, data);
    if (!res.success) {
      toast.error(res.error ?? "Something went wrong!");
      return;
    }

    // the stat cards read status and gender, so they go stale on their own
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
    queryClient.invalidateQueries({ queryKey: ["statlist"] });
    toast.success("Teacher updated");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          aria-label="Edit teacher"
        >
          <Pen />
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              {user.photoUrl && (
                <AvatarImage src={user.photoUrl} alt={user.nameEnglish} />
              )}
              <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
                {getInitials(user.nameEnglish)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle>Edit teacher</DialogTitle>
              <DialogDescription className="truncate">
                {user.nameEnglish} · {user.designation}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(submit)}>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
              <FormInput
                control={form.control}
                name="nameEnglish"
                label="English name"
              />

              <FormInput
                control={form.control}
                name="nameBangla"
                label="Bangla name"
              />

              <FormInput
                control={form.control}
                name="designation"
                label="Designation"
              />

              <FormInput
                control={form.control}
                name="email"
                type="email"
                label="E-mail"
              />

              <FormInput
                control={form.control}
                name="mobile"
                label="Mobile"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Gender
                  </label>
                  <NativeSelect
                    defaultValue={form.getValues("gender")}
                    {...form.register("gender")}
                    className="h-9 w-full text-xs"
                  >
                    <NativeSelectOption value="MALE">Male</NativeSelectOption>
                    <NativeSelectOption value="FEMALE">
                      Female
                    </NativeSelectOption>
                    <NativeSelectOption value="OTHER">Other</NativeSelectOption>
                  </NativeSelect>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <NativeSelect
                    defaultValue={form.getValues("status")}
                    {...form.register("status")}
                    className="h-9 w-full text-xs"
                  >
                    <NativeSelectOption value="ACTIVE">
                      Active
                    </NativeSelectOption>
                    <NativeSelectOption value="INACTIVE">
                      Inactive
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting && <Spinner />} Save changes
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
