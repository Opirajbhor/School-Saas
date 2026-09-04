"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@/components/ui/spinner";
import { AddStudentType, addStudentZod } from "@/src/validation/student.zod";
import {
  addStudent,
  getAcademicInfo,
} from "@/src/server-actions/student.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { classData } from "@/src/data/class-data/class-data";
import { SpinnerCustom } from "@/components/Spinner";
import { FormSelect } from "@/components/forms/form-select";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";

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
  // --------------active session-----------------
  const [activeSession, setActiveSession] = useState<
    AcademicInfoType | null | undefined
  >(null);

  useEffect(() => {
    const sessionRes = async () => {
      await clientReadAction(getAcademicInfo, {
        onSuccess: (data) => {
          setActiveSession(data as AcademicInfoType);
        },
      });
    };
    sessionRes();
  }, []);
  // ------------------form------------
  const methods = useForm();

  const form = useForm({
    resolver: zodResolver(addStudentZod),
    defaultValues: {
      photoUrl: "",
      studentId: `HAR-${randomId}`,
      session: activeSession?.id,
    },
  });
  const { isSubmitting } = form.formState;

  // ----------form Effect------------
  const selectedSession = useWatch({
    control: form.control,
    name: "session",
  });
  const selectedClass = useWatch({
    control: form.control,
    name: "className",
  });

  // -----for selected sections------------
  const selectedClassData = activeSession?.classes?.find(
    (item) => item.id === selectedClass,
  );
  const selectClassSections = selectedClassData?.sections ?? [];

  useEffect(() => {
    form.setValue("className", "");
    form.setValue("section", "");
  }, [selectedSession, form]);

  // ---------handle button------------
  const addBtn = async (data: AddStudentType) => {
    await handleCrudAction(addStudent, data, {
      successMessage: "Student Created Successfully",
      onSuccess: (data) => {
        form.reset();
      },
    });
  };
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
      <FormProvider {...methods}>
        <form onSubmit={form.handleSubmit(addBtn)}>
          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {/*------------SESSION----------- */}
              <FormSelect
                control={form.control}
                name="session"
                label="Session"
                options={
                  activeSession
                    ? [{ label: activeSession.year, value: activeSession.id }]
                    : []
                }
              />

              {/*------------CLASS----------- */}

              <FormSelect
                control={form.control}
                name="className"
                label="Class"
                options={
                  activeSession?.classes?.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })) ?? []
                }
              />
              {/*------------SECTION----------- */}

              <FormSelect
                control={form.control}
                name="section"
                label="Section"
                options={
                  selectClassSections.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })) ?? []
                }
              />
              {/*------------ROLL----------- */}

              <FormInput
                control={form.control}
                name="roll"
                label="Roll No"
                placeholder="Enter Roll "
              />
              {/*------------STATUS----------- */}

              <FormSelect
                control={form.control}
                name="status"
                label="Status"
                options={[
                  { label: "ACTIVE", value: "ACTIVE" },
                  { label: "INACTIVE", value: "INACTIVE" },
                ]}
              />
            </CardContent>
          </Card>

          {/* Student Information */}
          <Card className="my-5">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/*------------PHOTO----------- */}

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
                {/*------------STUDENT ID----------- */}

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input value={"HAR"} disabled />
                  </div>
                  {/*------------ENGLISH NAME----------- */}

                  <FormInput
                    control={form.control}
                    name="englishName"
                    label="English Name"
                    placeholder="Enter Name "
                  />
                  {/*------------BANGLA NAME----------- */}

                  <FormInput
                    control={form.control}
                    name="banglaName"
                    label="Bangla Name"
                    placeholder="Name "
                  />
                  {/*------------FATHER NAME----------- */}

                  <FormInput
                    control={form.control}
                    name="fatherName"
                    label="Father Name"
                    placeholder="Father Name "
                  />
                  {/*------------MOHTER NAME----------- */}

                  <FormInput
                    control={form.control}
                    name="motherName"
                    label="Mother Name"
                    placeholder="Mother Name "
                  />

                  {/*------------DOB----------- */}

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" {...form.register("dateOfBirth")} />
                  </div>
                  {/*------------GENDER----------- */}

                  <FormSelect
                    control={form.control}
                    name="gender"
                    label="Gender"
                    options={[
                      { label: "MALE", value: "MALE" },
                      { label: "FEMALE", value: "FEMALE" },
                      { label: "OTHERS", value: "OTHERS" },
                    ]}
                  />

                  {/*------------RELIGION----------- */}
                  <FormSelect
                    control={form.control}
                    name="religion"
                    label="Religion"
                    options={[
                      { label: "ISLAM", value: "ISLAM" },
                      { label: "HINDUISM", value: "HINDUISM" },
                      { label: "BUDDHIST", value: "BUDDHIST" },
                      { label: "CRISTIAN", value: "CRISTIAN" },
                    ]}
                  />
                  {/*------------BIRTH NO----------- */}
                  <FormInput
                    control={form.control}
                    name="birthCertificateNo"
                    label="Birth Certificate No."
                    placeholder="Birth Certificate No."
                  />
                  {/*------------PHONE----------- */}
                  <FormInput
                    control={form.control}
                    name="phone"
                    label="Phone"
                    placeholder="Phone"
                  />
                  {/*------------ADDRESS----------- */}
                  <FormTextarea
                    control={form.control}
                    name="address"
                    label="Address"
                    placeholder="Address"
                  />
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
      </FormProvider>
    </div>
  );
}
