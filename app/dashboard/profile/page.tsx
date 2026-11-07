"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowSquareOut,
  Check,
  EnvelopeSimple,
  Globe as MapPin,
  Minus,
  Palette,
  PencilSimple as PencilLine,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  UsersThree,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormInput } from "@/components/forms/form-input";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";
import RedAlert from "@/components/dashboard/alert-notice/red-alert";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { InstituteOutput } from "@/src/validation/auth.zod";
import {
  InsituteProfileUpdateType,
  insituteProfileUpdateZod,
} from "@/src/validation/institute-profile.zod";
import type { Teacherlist } from "@/src/validation/teacher.zod";
import {
  getInstituteProfile,
  instituteProfileUpdate,
} from "@/src/server-actions/shared/get-user-profile.action";
import { getTeacher } from "@/app/dashboard/teachers/_actions/teacher.action";
import { authClient } from "@/src/better-auth/auth-client";
import { ChangePasswordDialog } from "./_components/change-password-card";
import {
  ImageUpload,
  type ImageUploadHandle,
} from "@/components/forms/image-upload";

/** "BAJITPUR PILOT MODEL HIGH SCHOOL" -> "BP" */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// InstituteOutput is the onboarding form shape, so it does not carry the
// status column that the row does
type InstituteRecord = InstituteOutput & {
  status?: string;
  signature?: string | null;
};

/**
 * What each seat can do, read off the server-action guards. Deliberately
 * read-only: access follows the role, not a per-person switch, so a toggle here
 * would only lie about what the server actually enforces.
 */
const CAPABILITIES: { area: string; admin: boolean; teacher: boolean }[] = [
  { area: "Institute profile & branding", admin: true, teacher: false },
  { area: "Students — add, edit, status", admin: true, teacher: false },
  { area: "Teachers & seat assignment", admin: true, teacher: false },
  { area: "Classes, groups, subjects", admin: true, teacher: false },
  { area: "Exams, mark types, grade ranges", admin: true, teacher: false },
  { area: "Marks entry", admin: true, teacher: true },
  { area: "Mark approval & resubmission", admin: true, teacher: false },
  { area: "Attendance sheets & printing", admin: true, teacher: true },
  { area: "Results, admit cards, routines", admin: true, teacher: true },
  { area: "Notices & support tickets", admin: true, teacher: true },
  { area: "Sign-in account & password", admin: true, teacher: true },
];

/** one read-only fact row */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function InstituteProfilePage() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("profile");
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isPending,
    isError,
  } = useQuery<InstituteRecord>({
    queryKey: ["profile", "institute"],
    queryFn: async () => {
      const result = await getInstituteProfile();
      if (!result) throw new Error("Could not load the institute profile.");
      return result.institute as InstituteRecord;
    },
  });

  // members of this institute, for the team tab
  const { data: teachers = [] } = useQuery<Teacherlist[]>({
    queryKey: ["profile", "members"],
    queryFn: async () => {
      const result = await getTeacher();
      return result.success ? (result.data as Teacherlist[]) : [];
    },
    staleTime: 60_000,
  });

  const form = useForm<InsituteProfileUpdateType>({
    resolver: zodResolver(insituteProfileUpdateZod),
    defaultValues: {
      nameBangla: "",
      nameEnglish: "",
      phone: "",
      logo: "",
      signature: "",
    },
  });

  const { isSubmitting } = form.formState;
  const signatureUrl = useWatch({ control: form.control, name: "signature" });
  const logoUrl = useWatch({ control: form.control, name: "logo" });
  const [signatureApi, setSignatureApi] =
    useState<ImageUploadHandle | null>(null);
  const [logoApi, setLogoApi] = useState<ImageUploadHandle | null>(null);

  useEffect(() => {
    if (profile) {
      form.reset({
        nameBangla: profile.nameBangla,
        nameEnglish: profile.nameEnglish,
        phone: profile.phone,
        logo: profile.logo ?? "",
        signature: profile.signature ?? "",
      });
    }
  }, [profile, form]);

  const openEditor = () => {
    if (profile) {
      // every edit starts from what is stored, not from a half-finished attempt
      form.reset({
        nameBangla: profile.nameBangla,
        nameEnglish: profile.nameEnglish,
        phone: profile.phone,
        logo: profile.logo ?? "",
        signature: profile.signature ?? "",
      });
    }
    setOpen(true);
  };

  const onSubmit = async (data: InsituteProfileUpdateType) => {
    // the logo and the signature are staged like any other photo and only go
    // to Cloudinary when the form is saved
    const pendingLogo = logoApi?.hasPending();
    const uploadedLogo = await logoApi?.upload();
    if (pendingLogo && !uploadedLogo) return;

    const pending = signatureApi?.hasPending();
    const uploaded = await signatureApi?.upload();
    if (pending && !uploaded) return;

    await handleCrudAction(
      instituteProfileUpdate,
      {
        ...data,
        logo: uploadedLogo ?? data.logo,
        signature: uploaded ?? data.signature,
      },
      {
        successMessage: "Institute profile updated",
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["profile", "institute"] });
          setOpen(false);
        },
      },
    );
  };

  if (isPending) {
    return <PageSkeleton rows={4} />;
  }

  if (isError || !profile) {
    return (
      <main className="my-6 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load the institute profile
          </p>
          <p className="text-xs text-muted-foreground">
            Refresh the page to try again.
          </p>
        </Card>
      </main>
    );
  }

  const user = session?.user;
  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "ACTIVE",
  );

  return (
    <main className="my-6 w-full max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Institute profile"
        subtitle="The identity shown on mark sheets, results and reports."
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={profile.status} />
            <Button size="sm" variant="outline" onClick={openEditor}>
              <PencilLine /> Edit
            </Button>
          </div>
        }
      />

      {/* only shown when the session actually says the email is unverified */}
      {user && user.emailVerified === false && (
        <RedAlert
          title="Email is not verified"
          description={`Verify ${user.email} to receive result notifications.`}
        />
      )}

      {/* identity header — the one block every tab agrees on */}
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-start gap-4 p-5">
          <Avatar className="size-16 rounded-xl">
            {profile.logo ? (
              <AvatarImage src={profile.logo} alt={profile.nameEnglish} />
            ) : null}
            <AvatarFallback className="rounded-xl text-base font-semibold">
              {initialsOf(profile.nameEnglish) || "EI"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg leading-tight font-semibold text-foreground">
              {profile.nameBangla}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.nameEnglish}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="rounded border bg-muted/40 px-1.5 py-0.5 font-medium tabular-nums">
                EIIN {profile.eiin}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {profile.upazila}, {profile.district}, {profile.division}
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                <Phone className="size-3.5" />
                {profile.phone}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <p className="text-[11px] text-muted-foreground">Team</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {activeTeachers.length}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                active
              </span>
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList
          variant="line"
          className="w-full justify-start gap-5 overflow-x-auto border-b px-1 pb-0"
        >
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            Members
            {teachers.length > 0 && (
              <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold tabular-nums">
                {teachers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------- profile */}
        <TabsContent value="profile" className="mt-3">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Institute details
                </h2>
                <p className="text-xs text-muted-foreground">
                  The EIIN identifies this institute and is not editable here.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">
              <Field label="Name (English)" value={profile.nameEnglish} />
              <Field label="Name (Bangla)" value={profile.nameBangla} />
              <Field
                label="Phone"
                value={<span className="tabular-nums">{profile.phone}</span>}
              />
              <Field
                label="EIIN"
                value={<span className="tabular-nums">{profile.eiin}</span>}
              />
              <div>
                <Field
                  label="Account email"
                  value={
                    <span className="flex flex-wrap items-center gap-2">
                      {user?.email ?? "—"}
                      {user?.emailVerified ? (
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="h-5 text-[10px] text-amber-700 ring-amber-200 dark:text-amber-300"
                        >
                          Not verified
                        </Badge>
                      )}
                    </span>
                  }
                />
              </div>
              {/* right column, directly under the EIIN */}
              <div>
                <Field
                  label="Location"
                  value={`${profile.upazila}, ${profile.district}, ${profile.division}`}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* --------------------------------------------------- branding */}
        <TabsContent value="branding" className="mt-3">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Palette className="size-4 text-muted-foreground" />
                  Branding
                </h2>
                <p className="text-xs text-muted-foreground">
                  Printed on ID cards, admit cards, routines and result sheets.
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                  Institute logo
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
                    {profile.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.logo}
                        alt="Institute logo"
                        className="size-full object-contain"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold">
                        {initialsOf(profile.nameEnglish) || "EI"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {profile.logo ? "Logo set" : "No logo yet"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Sidebar and printed documents
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                  Head teacher signature
                </p>
                <div className="flex flex-col items-center gap-1 pt-1">
                  {profile.signature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.signature}
                      alt="Head teacher signature"
                      className="h-8 w-auto max-w-32 object-contain mix-blend-multiply dark:invert"
                    />
                  ) : (
                    <span className="flex h-8 items-center text-[11px] text-muted-foreground">
                      No signature yet
                    </span>
                  )}
                  <span className="w-32 border-t border-foreground/40" />
                  <span className="text-[10px] text-muted-foreground">
                    Head teacher
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------- members */}
        <TabsContent value="members" className="mt-3">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <UsersThree className="size-4 text-muted-foreground" />
                  Members
                </h2>
                <p className="text-xs text-muted-foreground">
                  Everyone with a seat in this institute.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/teachers">
                  Manage teachers <ArrowSquareOut className="size-3.5" />
                </Link>
              </Button>
            </div>

            {teachers.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No teachers yet — add them from the Teachers page.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Designation</th>
                      <th className="px-4 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">Mobile</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7 rounded-md">
                              {teacher.photoUrl ? (
                                <AvatarImage
                                  src={teacher.photoUrl}
                                  alt={teacher.nameEnglish}
                                />
                              ) : null}
                              <AvatarFallback className="rounded-md text-[10px] font-semibold">
                                {initialsOf(teacher.nameEnglish) || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {teacher.nameEnglish}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {teacher.nameBangla}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {teacher.designation}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {teacher.email}
                        </td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">
                          {teacher.mobile}
                        </td>
                        <td className="px-4 py-2">
                          <StatusPill status={teacher.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ------------------------------------------------- permissions */}
        <TabsContent value="permissions" className="mt-3">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="border-b px-4 py-3">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                Permissions
              </h2>
              <p className="text-xs text-muted-foreground">
                Read-only: access follows the seat, not a per-person switch.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Capability</th>
                    <th className="w-32 px-4 py-2 text-center font-medium">
                      Institute admin
                    </th>
                    <th className="w-28 px-4 py-2 text-center font-medium">
                      Teacher
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITIES.map((row) => (
                    <tr key={row.area} className="border-b last:border-0">
                      <td className="px-4 py-2 text-foreground">{row.area}</td>
                      <td className="px-4 py-2 text-center">
                        {row.admin ? (
                          <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Minus className="mx-auto size-4 text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.teacher ? (
                          <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Minus className="mx-auto size-4 text-muted-foreground/40" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="border-t px-4 py-3 text-[11px] text-muted-foreground">
              Teachers reach only the sections and subjects assigned to them. The
              platform (superadmin) seat sits outside this institute.
            </p>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------- account */}
        <TabsContent value="account" className="mt-3">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  Sign-in account
                </h2>
                <p className="text-xs text-muted-foreground">
                  The account that owns this institute.
                </p>
              </div>
              <ChangePasswordDialog />
            </div>

            <div className="divide-y">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <EnvelopeSimple className="size-4" />
                  {user?.email ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.emailVerified ? "Verified" : "Not verified"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4" />
                  Signed in as
                </span>
                <span className="text-sm font-medium text-foreground">
                  {user?.name ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UsersThree className="size-4" />
                  Seat
                </span>
                <Badge variant="secondary">Institute admin</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------------------------------------------- edit modal */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // leaving the dialog discards anything that was staged but not saved
          if (!next && profile) {
            form.reset({
              nameBangla: profile.nameBangla,
              nameEnglish: profile.nameEnglish,
              phone: profile.phone,
              logo: profile.logo ?? "",
              signature: profile.signature ?? "",
            });
          }
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>Edit institute</DialogTitle>
            <DialogDescription>
              Name and phone appear on every printed document. The EIIN and
              location are set at onboarding.
            </DialogDescription>
          </DialogHeader>

          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <FormInput
                  control={form.control}
                  name="nameEnglish"
                  label="Name (English)"
                  placeholder="e.g. Bajitpur Pilot Model High School"
                />
                <FormInput
                  control={form.control}
                  name="nameBangla"
                  label="Name (Bangla)"
                  placeholder="প্রতিষ্ঠানের নাম"
                />
                <FormInput
                  control={form.control}
                  name="phone"
                  label="Phone"
                  placeholder="01XXXXXXXXX"
                />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">EIIN</p>
                  <p className="flex h-9 items-center rounded-md border bg-muted/40 px-2.5 text-sm tabular-nums text-muted-foreground">
                    {profile.eiin}
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                  <ImageUpload
                    register={setLogoApi}
                    value={logoUrl}
                    onChange={(url) =>
                      form.setValue("logo", url, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    folder="institute"
                    label="Logo"
                    size="size-14"
                    className="[&_p]:hidden"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Logo</p>
                    <p className="text-xs text-muted-foreground">
                      Sidebar and printed documents. A square PNG works best.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                  <ImageUpload
                    register={setSignatureApi}
                    value={signatureUrl}
                    onChange={(url) =>
                      form.setValue("signature", url, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    folder="institute"
                    label="Signature"
                    size="size-14"
                    className="[&_p]:hidden"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Head teacher signature
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Printed above the signature line on ID cards and results.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />} Save changes
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </main>
  );
}
