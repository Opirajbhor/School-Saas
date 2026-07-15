"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MdEditNote } from "react-icons/md";
import { toast } from "sonner";
import { DeleteTeacherProps } from "./delete-teacher";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { editTeacherType, editTeacherZod } from "@/src/validation/teacher.zod";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export default function EditTeachers({
  user,
  setTeachers,
}: DeleteTeacherProps) {
  const form = useForm<editTeacherType>({
    resolver: zodResolver(editTeacherZod),
    defaultValues: {
      id: user.id,
      nameBangla: user.nameBangla,
      nameEnglish: user.nameEnglish,
      designation: user.designation,
      mobile: user.mobile,
      email: user.email,
      photoUrl: user.photoUrl,
      gender: user.gender,
      status: user.status,
    },
  });

  //   edit button
  const editBtn = async (data: editTeacherType) => {
    toast.success("working");
    console.log(data);
  };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="cursor-pointer ml-3  text-xl" variant="default">
          <MdEditNote />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Teacher Details</SheetTitle>
          <SheetDescription>
            Make changes to Teacher. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <form action="" onSubmit={form.handleSubmit(editBtn)}>
          <Card className="overflow-hidden ">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="border-b p-6 flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.photoUrl} />
                  <AvatarFallback>
                    {user.nameEnglish
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <Button variant="outline" size="sm">
                  Change Photo
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nameEnglish">English Name</Label>
                  <Input
                    id="nameEnglish"
                    {...form.register("nameEnglish")}
                    defaultValue={user.nameEnglish}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameBangla">Bangla Name</Label>
                  <Input
                    id="nameBangla"
                    {...form.register("nameBangla")}
                    defaultValue={user.nameBangla}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    {...form.register("designation")}
                    defaultValue={user.designation}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    defaultValue={user.email}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    {...form.register("mobile")}
                    defaultValue={user.mobile}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <NativeSelect
                      defaultValue={form.getValues("gender")}
                      {...form.register("gender")}
                      className="w-full text-xs h-9"
                    >
                      <NativeSelectOption value="MALE">
                        পুরুষ
                      </NativeSelectOption>
                      <NativeSelectOption value="FEMALE">
                        মহিলা
                      </NativeSelectOption>
                      <NativeSelectOption value="OTHER">
                        অন্যান্য
                      </NativeSelectOption>
                    </NativeSelect>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <NativeSelect
                      defaultValue={form.getValues("status")}
                      {...form.register("status")}
                      className="w-full text-xs h-9"
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
            </CardContent>
          </Card>

          <SheetFooter className="grid grid-cols-2 items-center justify-center">
            <Button variant="default">Save Changes</Button>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
