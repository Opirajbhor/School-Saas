"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpinnerCustom } from "@/components/Spinner";
import Title from "@/components/Title";
import { FormSelect } from "@/components/forms/form-select";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import {
  AcademicInfoType,
  StudentDetail,
  editStudentZod,
} from "@/src/validation/student.zod";
import {
  getAcademicInfo,
  getStudentEnrollment,
  updateStudent,
} from "../../../_actions/student.action";

/** value for an <input type="date"> */
const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function EditStudentForm({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: enrollment, isPending } = useQuery<StudentDetail>({
    queryKey: ["page-Student", "detail", id],
    queryFn: async () => {
      const result = await getStudentEnrollment(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as unknown as StudentDetail;
    },
  });

  const { data: academicInfo, isPending: academicPending } =
    useQuery<AcademicInfoType>({
      queryKey: ["page-addStudent"],
      queryFn: async () => {
        const result = await getAcademicInfo();
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data as AcademicInfoType;
      },
    });

  // untyped like the add form: the resolver owns the input/output types, and
  // pinning them here fights zod's coercion of dateOfBirth
  const form = useForm({
    resolver: zodResolver(editStudentZod),
    defaultValues: {
      studentId: "",
      englishName: "",
      banglaName: "",
      fatherName: "",
      motherName: "",
      gender: "MALE",
      religion: "",
      phone: "",
      address: "",
      photoUrl: "",
      birthCertificateNo: "",
      className: "",
      section: "",
      roll: "",
      groupId: null,
      status: "ACTIVE",
    },
  });

  const { isSubmitting } = form.formState;

  // fill the form once the record arrives
  useEffect(() => {
    if (!enrollment) return;
    const { student } = enrollment;
    form.reset({
      studentId: student.studentId,
      englishName: student.englishName,
      banglaName: student.banglaName ?? "",
      fatherName: student.fatherName,
      motherName: student.motherName,
      gender: student.gender,
      dateOfBirth: toDateInput(student.dateOfBirth),
      religion: student.religion,
      phone: student.phone,
      photoUrl: student.photoUrl ?? "",
      birthCertificateNo: student.birthCertificateNo ?? "",
      address: student.address,
      className: enrollment.classId,
      section: enrollment.sectionId,
      roll: enrollment.roll,
      groupId: enrollment.group?.id ?? null,
      // the enrolment status is what the table toggles
      status: enrollment.status,
    });
  }, [enrollment, form]);

  // class -> section/group cascade, same as the add form
  const selectedClass = useWatch({ control: form.control, name: "className" });
  const selectedClassData = useMemo(
    () => academicInfo?.classes?.find((item) => item.id === selectedClass),
    [academicInfo, selectedClass],
  );
  const classSections = useMemo(
    () => selectedClassData?.sections ?? [],
    [selectedClassData],
  );
  const classGroups = useMemo(
    () => selectedClassData?.groupClasses ?? [],
    [selectedClassData],
  );

  // changing class invalidates a section/group from the old one. Skipped until
  // the record has loaded, so the saved section is not wiped on first render.
  const loaded = enrollment !== undefined;
  useEffect(() => {
    if (!loaded || !selectedClass) return;
    const currentSection = form.getValues("section");
    const stillValid = classSections.some((item) => item.id === currentSection);
    if (!stillValid) {
      form.setValue("section", classSections[0]?.id ?? "");
    }
  }, [loaded, selectedClass, classSections, form]);

  const submitBtn = async (data: Parameters<typeof updateStudent>[1]) => {
    // the schema coerces the raw "YYYY-MM-DD" string on the server
    const res = await updateStudent(id, data);

    if (!res.success) {
      const firstDetail = Object.values(res.details ?? {})[0]?.[0];
      toast.error(firstDetail ?? res.error ?? "Failed to update student");
      return;
    }

    // the table reads these two queries
    queryClient.invalidateQueries({ queryKey: ["page-Student", "enrollment"] });
    queryClient.invalidateQueries({ queryKey: ["page-Student", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["page-Student", "detail", id] });

    toast.success("Student updated successfully");
    router.push(`/dashboard/students/${id}`);
  };

  if (isPending || academicPending) {
    return <SpinnerCustom />;
  }

  if (!enrollment) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6 space-y-4">
        <Title title="Student Not Found" />
        <p className="text-sm text-muted-foreground">
          This student does not exist or is not part of your institute.
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/students">Back to students</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      <div>
        <Title title="Edit Student" />
        <p className="text-sm text-muted-foreground">
          Update {enrollment.student.englishName}&apos;s details and placement.
        </p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(submitBtn)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* session is fixed for the enrolment, so it is read-only */}
              <div className="space-y-2">
                <Label>Session</Label>
                <Input value={enrollment.session?.year ?? ""} disabled />
              </div>

              <FormSelect
                control={form.control}
                name="className"
                label="Class"
                options={
                  academicInfo?.classes?.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })) ?? []
                }
              />

              <FormSelect
                control={form.control}
                name="section"
                label="Section"
                options={classSections.map((item) => ({
                  label: item.name ?? "",
                  value: item.id ?? "",
                }))}
              />

              <FormInput
                control={form.control}
                name="roll"
                label="Roll No"
                placeholder="Enter Roll"
              />

              <FormSelect
                control={form.control}
                name="groupId"
                label="Group"
                options={classGroups.map((item) => ({
                  label: item.group.name,
                  value: item.group.id,
                }))}
              />

              <FormSelect
                control={form.control}
                name="status"
                label="Status"
                options={[
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormInput
                control={form.control}
                name="studentId"
                label="Student ID"
                placeholder="Student ID"
              />
              <FormInput
                control={form.control}
                name="englishName"
                label="English Name"
                placeholder="Enter Name"
              />
              <FormInput
                control={form.control}
                name="banglaName"
                label="Bangla Name"
                placeholder="Name"
              />
              <FormInput
                control={form.control}
                name="fatherName"
                label="Father Name"
                placeholder="Father Name"
              />
              <FormInput
                control={form.control}
                name="motherName"
                label="Mother Name"
                placeholder="Mother Name"
              />

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  {...form.register("dateOfBirth")}
                  defaultValue={toDateInput(enrollment.student.dateOfBirth)}
                />
              </div>

              <FormSelect
                control={form.control}
                name="gender"
                label="Gender"
                options={[
                  { label: "Male", value: "MALE" },
                  { label: "Female", value: "FEMALE" },
                  { label: "Other", value: "OTHER" },
                ]}
              />

              <FormSelect
                control={form.control}
                name="religion"
                label="Religion"
                options={[
                  { label: "Islam", value: "ISLAM" },
                  { label: "Hinduism", value: "HINDUISM" },
                  { label: "Buddhist", value: "BUDDHIST" },
                  { label: "Christian", value: "CRISTIAN" },
                ]}
              />

              <FormInput
                control={form.control}
                name="birthCertificateNo"
                label="Birth Certificate No."
                placeholder="Birth Certificate No."
              />
              <FormInput
                control={form.control}
                name="phone"
                label="Phone"
                placeholder="Phone"
              />
              <FormTextarea
                control={form.control}
                name="address"
                label="Address"
                placeholder="Address"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/students/${id}`}>Cancel</Link>
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting && <Spinner />}
              Save Changes
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
