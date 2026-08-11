"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MdEditNote } from "react-icons/md";
import {
  academicSessionType,
  academicSessionZod,
  sessionList,
} from "@/src/validation/academicSessions.zod";
import { updateSessions } from "@/src/server-actions/academicSession.action";
import { toast } from "sonner";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
export default function EditSession({
  session,
  setSessions,
}: {
  session: sessionList; // Changed from updateSessionType
  setSessions: Dispatch<SetStateAction<sessionList[]>>; // Changed from updateSessionType[]
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<academicSessionType>({
    resolver: zodResolver(academicSessionZod),
    defaultValues: {
      year: session.year,
      isActive: session.isActive ?? true,
    },
  });

  const onSubmit = async (data: academicSessionType) => {
    try {
      const res = await updateSessions(session.id, data);
      if (res.success) {
        toast.success("Session updated successfully");
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id ? { ...s, ...data } : s)),
        );
        setOpen(false);
        reset(data);
      } else {
        toast.error(res.error || "Failed to update session");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer ml-3 text-xl" variant="default">
          <MdEditNote />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Academic Session</SheetTitle>
          <SheetDescription>
            Make changes to Academic Session. Click save when done.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit, (errors) =>
            console.log("Validation Errors:", errors),
          )}
        >
          <div className="overflow-hidden">
            <div className="p-0 h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="year">Session Name</Label>
                  <Input
                    id="year"
                    {...register("year")}
                    type="string"
                    disabled={isSubmitting}
                  />
                  {errors.year && (
                    <p className="text-sm text-red-500">
                      {errors.year.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pt-2">
                    <Controller
                      control={control}
                      name="isActive"
                      render={({ field }) => (
                        <Checkbox
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                    <Label
                      htmlFor="isActive"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Activate Session
                    </Label>
                  </div>

                  {errors.isActive && (
                    <p className="text-sm text-red-500">
                      {errors.isActive.message as string}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
