"use client";
import { useEffect, useState } from "react";
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
import {
  addStudent,
  getAcademicInfo,
} from "@/src/server-actions/student.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import Link from "next/link";
import { classData } from "@/src/data/class-data/class-data";
import { SpinnerCustom } from "@/components/Spinner";

const randomId = Math.floor(Math.random() * 100) + 1;

export interface AcademicInfoType {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  instituteId: string;
  year: string;
  isActive: boolean;
  classes: Array<{
    id: string;
    name: string;
    createdAt: Date;
    sections: Array<{
      id: string;
      name: string;
      classId: string;
      createdAt: Date;
      updatedAt: Date;
      instituteId?: string;
      userId?: string | null;
      isActive?: boolean;
    }>;
  }>;
}
export default function AddStudent() {
  // active session-----------------
  const [activeSession, setActiveSession] = useState<
    AcademicInfoType | null | undefined
  >(null); // -----------------------
  useEffect(() => {
    const sessionRes = async () => {
      const info = await getAcademicInfo();
      if (info.success) {
        // Coalesce undefined to null if needed, or pass directly
        setActiveSession(info.data ?? null);
      }
    };

    // const classRes = async()=>{
    //   const res = await 
    // }



    sessionRes();
  }, []);
  //xxxx active session------------------
  // ------------------form------------
  const form = useForm({
    resolver: zodResolver(addStudentZod),
    defaultValues: {
      studentId: `HAR-${randomId}`,
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
      session: activeSession?.id,
    },
  });
  const { isSubmitting } = form.formState;
  const addBtn = async (data: AddStudentType) => {
    console.log(data);
  };

  const addBtns = async (data: AddStudentType) => {
    const res = await addStudent(data);
    if (res.success) {
      toast.success("student added successfully");
      form.reset();
    }
    if (!res.success) {
      toast.error("student adding failed");
    }
  };
  //xxxxxxx form---------------------
  if (activeSession === null || undefined) {
    return <SpinnerCustom />;
  }
  return (
    <div className="w-full mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Student</h1>
        <p className="text-sm text-muted-foreground">
          Create a new student and enroll them into a class.
        </p>
      </div>
      <form action="" onSubmit={form.handleSubmit(addBtn)}>
        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            <div className="space-y-2">
              <Label>Session</Label>
              <NativeSelect {...form.register("session")}>
                <NativeSelectOption value={activeSession?.id}>
                  {activeSession?.year}
                </NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <NativeSelect {...form.register("className")}>
                {classData &&
                  classData.map((item, i) => (
                    <NativeSelectOption key={i} value={item}>
                      {item}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <NativeSelect {...form.register("section")}>
                <NativeSelectOption>A</NativeSelectOption>
                <NativeSelectOption>B</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Roll</Label>
              <Input placeholder="Enter Roll" {...form.register("roll")} />
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
                  accept="image/*"
                  className="max-w-55"
                />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input value={"HAR"} disabled />
                </div>

                <div className="space-y-2">
                  <Label>English Name</Label>
                  <Input
                    {...form.register("englishName", {
                      setValueAs: (value) => value.toUpperCase(),
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bangla Name</Label>
                  <Input {...form.register("banglaName")} />
                </div>

                <div className="space-y-2">
                  <Label>Father Name</Label>
                  <Input
                    {...form.register("fatherName", {
                      setValueAs: (value) => value.toUpperCase(),
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mother Name</Label>
                  <Input
                    {...form.register("motherName", {
                      setValueAs: (value) => value.toUpperCase(),
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...form.register("dateOfBirth")} />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <NativeSelect
                    {...form.register("gender", {
                      setValueAs: (value) => value.toUpperCase(),
                    })}
                  >
                    <NativeSelectOption value={"MALE"}>MALE</NativeSelectOption>
                    <NativeSelectOption value={"FEMALE"}>
                      FEMALE
                    </NativeSelectOption>
                    <NativeSelectOption value={"OTHERS"}>
                      OTHERS
                    </NativeSelectOption>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label>Religion</Label>
                  <NativeSelect
                    {...form.register("religion", {
                      setValueAs: (value) => value.toUpperCase(),
                    })}
                  >
                    <NativeSelectOption>ISLAM</NativeSelectOption>
                    <NativeSelectOption>HINDU</NativeSelectOption>
                    <NativeSelectOption>BUDDHIST</NativeSelectOption>
                    <NativeSelectOption>CRISTIAN</NativeSelectOption>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label>Birth Certificate No.</Label>
                  <Input {...form.register("birthCertificateNo")} />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input min={11} maxLength={11} {...form.register("phone")} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label> Address</Label>
                  <Textarea
                    rows={3}
                    {...form.register("address", {
                      setValueAs: (value) => value.toUpperCase(),
                    })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* {submit} */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">
            <Link href={"/dashboard/students"}>Cancel</Link>
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting && <Spinner />}
            Save Student
          </Button>
        </div>
      </form>
    </div>
  );
}
