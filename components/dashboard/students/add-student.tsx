"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AddStudentType, addStudentZod } from "@/src/validation/student.zod";
import { addStudent } from "@/src/server-actions/student.action";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default function AddStudent() {
  // ------------------form
  const form = useForm<AddStudentType>({
    resolver: zodResolver(addStudentZod),
    defaultValues: {
      instituteId: "",
      studentId: "",
      englishName: "",
      banglaName: "",
      gender: "MALE",
      dateOfBirth: undefined,
      bloodGroup: undefined,
      religion: "",
      nationality: "Bangladeshi",
      mobile: "",
      email: "",
      photoUrl: "",
      birthCertificateNo: "",
      presentAddress: "",
      permanentAddress: "",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;
  const addBtn = async (data: AddStudentType) => {
    const res = await addStudent(data);
    if (res.success === false) {
      if (res.details) {
        const firstErrorField = Object.keys(res.details)[0];
        const messages =
          res.details[firstErrorField as keyof typeof res.details];
        if (messages && messages.length > 0) {
          toast.error(messages[0]);
          return;
        }
      }

      // Fallback error fallback message
      toast.error(res.error || "An unexpected error occurred.");
      return;
    }
    if (res.success === true) {
      toast.success("Student added successfully");
      setStudents((prev) => {
        const current = prev || [];
        return [...current, res.data as Studentlist];
      });
      form.reset();
      setOpen(false);
    }
  };
  return (
    <div>
      {/* student form */}
      <form action="" onSubmit={form.handleSubmit(addBtn)}>
        <Card className="overflow-hidden ">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="border-b p-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={"./image.jpg"} />
              </Avatar>

              <Button variant="outline" size="sm">
                Upload Photo
              </Button>
            </div>
            {/* english name */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nameEnglish">English Name</Label>
                <Input id="nameEnglish" {...form.register("englishName")} />
              </div>

              {/* bangla name */}
              <div className="space-y-2">
                <Label htmlFor="nameBangla">Bangla Name</Label>
                <Input id="nameBangla" {...form.register("banglaName")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" {...form.register("designation")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" {...form.register("mobile")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <NativeSelect
                    defaultValue={form.getValues("gender")}
                    {...form.register("gender")}
                    className="w-full text-xs h-9"
                  >
                    <NativeSelectOption value="MALE">পুরুষ</NativeSelectOption>
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
      </form>
    </div>
  );
}
