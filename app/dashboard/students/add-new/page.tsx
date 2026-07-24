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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

export default function AddStudent() {
  // ------------------form
  const form = useForm<AddStudentType>({
    resolver: zodResolver(addStudentZod),
    defaultValues: {
      instituteId: "",
      studentId: "",
      englishName: "",
      banglaName: "",
      fatherName: "",
      motherName: "",
      gender: "MALE",
      dateOfBirth: new Date(),
      religion: "ISLAM",
      phone: "",
      photoUrl: "",
      birthCertificateNo: "",
      address: "",
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
    <div className="w-full mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Student</h1>
        <p className="text-sm text-muted-foreground">
          Create a new student and enroll them into a class.
        </p>
      </div>
      <form action="">
        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            <div className="space-y-2">
              <Label>Session</Label>
              <NativeSelect>
                <NativeSelectOption>Select Session</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <NativeSelect>
                <NativeSelectOption>Select Class</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <NativeSelect>
                <NativeSelectOption>Select Section</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Roll</Label>
              <Input placeholder="Enter Roll" />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <NativeSelect {...form.register("status")}>
                <NativeSelectOption>ACTIVE</NativeSelectOption>
                <NativeSelectOption>INACTIVE</NativeSelectOption>
              </NativeSelect>
            </div>
          </CardContent>
        </Card>

        {/* Student Information */}
        <Card className="my-5">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-28 w-28">
                  <AvatarImage />
                  <AvatarFallback>Photo</AvatarFallback>
                </Avatar>

                <Input
                  {...form.register("photoUrl")}
                  type="file"
                  className="max-w-55"
                />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input value={'abc'} disabled />
                </div>

                <div className="space-y-2">
                  <Label>English Name</Label>
                  <Input {...form.register("englishName")} />
                </div>

                <div className="space-y-2">
                  <Label>Bangla Name</Label>
                  <Input {...form.register("banglaName")} />
                </div>

                <div className="space-y-2">
                  <Label>Father Name</Label>
                  <Input {...form.register("fatherName")} />
                </div>

                <div className="space-y-2">
                  <Label>Mother Name</Label>
                  <Input {...form.register("motherName")} />
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...form.register("dateOfBirth")} />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <NativeSelect {...form.register("gender")}>
                    <NativeSelectOption>Male</NativeSelectOption>
                    <NativeSelectOption>Female</NativeSelectOption>
                    <NativeSelectOption>Other</NativeSelectOption>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label>Religion</Label>
                  <NativeSelect {...form.register("religion")}>
                    <NativeSelectOption>Islam</NativeSelectOption>
                    <NativeSelectOption>Hindu</NativeSelectOption>
                    <NativeSelectOption>Buddist</NativeSelectOption>
                    <NativeSelectOption>Christian</NativeSelectOption>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label>Birth Certificate No.</Label>
                  <Input {...form.register("birthCertificateNo")} />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register("phone")} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label> Address</Label>
                  <Textarea rows={3} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* {submit} */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save Student</Button>
        </div>
      </form>
    </div>
  );
}
