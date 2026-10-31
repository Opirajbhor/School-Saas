"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@/components/ui/spinner";
import {
  AcademicInfoType,
  AcademicSubjectType,
  AddStudentType,
  addStudentZod,
} from "@/src/validation/student.zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { FormSelect } from "@/components/forms/form-select";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addStudent, getAcademicInfo } from "../_actions/student.action";

const randomId = Math.floor(Math.random() * 100) + 1;

export default function AddStudent() {
  // ------------- query fn ---------------
  const { data: activeSession, isPending } = useQuery<AcademicInfoType>({
    queryKey: ["page-addStudent"],
    queryFn: async () => {
      const result = await getAcademicInfo();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as AcademicInfoType;
    },
  });
  const sessionId = activeSession?.session?.id ?? null;

  // ------------------form------------
  const form = useForm({
    resolver: zodResolver(addStudentZod),
    defaultValues: {
      photoUrl: "",
      studentId: `SID-${randomId}`,
      sessionId: null,
      status: "ACTIVE",
      groupId: null,
    },
  });
  const { isSubmitting } = form.formState;
  const queryClient = useQueryClient();
  // ----------form Effect------------

  const selectedClass = useWatch({
    control: form.control,
    name: "className",
  });

  // the ID is generated once and never typed, so it is displayed from form
  // state instead of being hardcoded in the field
  const studentId = useWatch({ control: form.control, name: "studentId" });
  const photoUrl = useWatch({ control: form.control, name: "photoUrl" });

  // -----for selected sections------------
  const selectedClassData = activeSession?.classes?.find(
    (item) => item.id === selectedClass,
  );
  const selectClassSections = selectedClassData?.sections ?? [];
  const selectClassGroups = selectedClassData?.groupClasses ?? [];

  // what this class studies, split the way a school thinks about it:
  // compulsory, group-scoped, and religion
  const classSubjectRows = (activeSession?.classSubjects ?? []).filter(
    (subject) => subject.classId === selectedClass,
  );
  const compulsorySubjects = classSubjectRows.filter(
    (subject) => !subject.isReligion && subject.groupId === null,
  );
  const religionSubjects = classSubjectRows.filter(
    (subject) => subject.isReligion,
  );
  const groupSubjects = classSubjectRows.filter(
    (subject) => !subject.isReligion && subject.groupId !== null,
  );
  const groupBuckets = Array.from(
    groupSubjects.reduce<Map<string, AcademicSubjectType[]>>(
      (buckets, subject) => {
        const key = subject.groupName ?? "Other group";
        const list = buckets.get(key) ?? [];
        list.push(subject);
        buckets.set(key, list);
        return buckets;
      },
      new Map(),
    ),
  );

  useEffect(() => {
    form.setValue("className", "");
    form.setValue("section", "");
    form.setValue("groupId", "");
    if (sessionId) {
      form.setValue("sessionId", sessionId);
    }
  }, [form, sessionId]);

  // ---------handle button------------
  const addBtn = async (data: AddStudentType) => {
    await handleCrudAction(addStudent, data, {
      successMessage: "Student Created Successfully",
      onSuccess: () => {
        // the list and its stat cards are cached under this prefix, so they
        // would otherwise still show the old counts until a hard reload
        queryClient.invalidateQueries({ queryKey: ["page-Student"] });
        form.reset({ ...form.formState.defaultValues, photoUrl: "" });
      },
    });
  };
  if (isPending) {
    return <PageSkeleton />;
  }
  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Add student"
        subtitle="Create a student record and enrol them into a class and section."
      />
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(addBtn)}>
          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/*------------Session----------- */}
              <div className="space-y-2">
                <Label>Session</Label>
                <Input value={activeSession?.session?.year ?? "—"} disabled />
              </div>
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
                  selectClassSections
                    ?.filter(
                      (item): item is typeof item & { id: string } =>
                        item.id !== undefined,
                    )
                    .map((item) => ({
                      label: item?.name,
                      value: item?.id,
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
              {/*------------Group----------- */}

              <FormSelect
                control={form.control}
                name="groupId"
                label="Group"
                options={
                  selectClassGroups?.map((item) => ({
                    label: item?.group.name,
                    value: item?.group.id,
                  })) ?? []
                }
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

                <div className="flex w-full flex-col items-center gap-3 sm:w-44">
                  <Avatar className="size-24">
                    {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
                    <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                      Photo
                    </AvatarFallback>
                  </Avatar>

                  {/* the DB column holds a URL, so this is a URL field. The old
                      <input type="file"> handed a File object to a string
                      column and failed validation on every submit. */}
                  <FormInput
                    control={form.control}
                    name="photoUrl"
                    label="Photo URL"
                    placeholder="https://..."
                    className="w-full"
                  />
                </div>
                {/*------------STUDENT ID----------- */}

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input value={studentId ?? ""} disabled />
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
                      { label: "Male", value: "MALE" },
                      { label: "Female", value: "FEMALE" },
                      // the schema enum is OTHER, not OTHERS — this option used
                      // to fail validation on submit
                      { label: "Other", value: "OTHER" },
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

          {/* Subjects of the selected class — shown after the student fields
              so the form reads top-to-bottom: who, then what they will study */}
          {selectedClassData && (
            <Card>
              <CardHeader>
                <CardTitle>Subjects · {selectedClassData.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <SubjectList
                  label="Compulsory"
                  subjects={compulsorySubjects}
                />

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Group subjects
                  </p>
                  {groupBuckets.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      This class has no group-based subjects.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {groupBuckets.map(([groupName, subjects]) => (
                        <div
                          key={groupName}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span className="min-w-24 text-xs font-medium text-foreground">
                            {groupName}
                          </span>
                          {subjects.map((subject) => (
                            <SubjectChip key={subject.subjectId}>
                              {subject.name}
                            </SubjectChip>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <SubjectList label="Religion" subjects={religionSubjects} />
              </CardContent>
            </Card>
          )}

          {/* {submit} */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/students">Cancel</Link>
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting && <Spinner />}
              Save Student
            </Button>
          </div>
        </form>
      </FormProvider>
    </main>
  );
}

function SubjectChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function SubjectList({
  label,
  subjects,
}: {
  label: string;
  subjects: AcademicSubjectType[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {subjects.length === 0 ? (
        <p className="text-xs text-muted-foreground">None assigned.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <SubjectChip key={subject.subjectId}>{subject.name}</SubjectChip>
          ))}
        </div>
      )}
    </div>
  );
}
