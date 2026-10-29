"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SpinnerCustom } from "@/components/Spinner";
import Title from "@/components/Title";
import { StudentDetail } from "@/src/validation/student.zod";
import { StatusBadge } from "../../_table/columns";
import { getStudentEnrollment } from "../../_actions/student.action";

const formatDate = (value: Date | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export default function StudentDetailView({ id }: { id: string }) {
  const {
    data: enrollment,
    isPending,
    isError,
  } = useQuery<StudentDetail>({
    queryKey: ["page-Student", "detail", id],
    queryFn: async () => {
      const result = await getStudentEnrollment(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as unknown as StudentDetail;
    },
  });

  if (isPending) {
    return <SpinnerCustom />;
  }

  // covers both "no such student" and "belongs to another institute"
  if (isError || !enrollment) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6 space-y-4">
        <Title title="Student Not Found" />
        <p className="text-sm text-muted-foreground">
          This student does not exist or is not part of your institute.
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/students">
            <ArrowLeft />
            Back to students
          </Link>
        </Button>
      </div>
    );
  }

  const { student, class: classInfo, section, group, session } = enrollment;
  const initials = student.englishName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Title title="Student Details" />
          <p className="text-sm text-muted-foreground">
            {student.englishName} · {student.studentId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/students">
              <ArrowLeft />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/students/${id}/edit`}>
              <Pen />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="h-28 w-28">
            <AvatarImage src={student.photoUrl ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="English Name" value={student.englishName} />
            <Field label="Bangla Name" value={student.banglaName} />
            <Field label="Student ID" value={student.studentId} />
            <Field label="Gender" value={student.gender} />
            <Field label="Religion" value={student.religion} />
            <Field
              label="Date of Birth"
              value={formatDate(student.dateOfBirth)}
            />
            <Field label="Nationality" value={student.nationality} />
            <Field
              label="Birth Certificate No."
              value={student.birthCertificateNo}
            />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Record Status
              </p>
              <div className="mt-1">
                <StatusBadge status={enrollment.status} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <Field label="Session" value={session?.year} />
          <Field label="Class" value={classInfo?.name} />
          <Field label="Section" value={section?.name} />
          <Field label="Roll" value={enrollment.roll} />
          <Field label="Group" value={group?.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Parents & Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Father Name" value={student.fatherName} />
          <Field label="Mother Name" value={student.motherName} />
          <Field label="Phone" value={student.phone} />
          <Field label="Email" value={student.email} />
          <div className="md:col-span-2">
            <Field label="Address" value={student.address} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
