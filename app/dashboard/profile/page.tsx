"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, PencilLine, Phone, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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
import {
  getInstituteProfile,
  instituteProfileUpdate,
} from "@/src/server-actions/shared/get-user-profile.action";
import { authClient } from "@/src/better-auth/auth-client";
import { ChangePasswordDialog } from "./_components/change-password-card";

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
type InstituteRecord = InstituteOutput & { status?: string };

export default function InstituteProfilePage() {
  const [locked, setLocked] = useState(true);
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

  const form = useForm<InsituteProfileUpdateType>({
    resolver: zodResolver(insituteProfileUpdateZod),
    defaultValues: {
      nameBangla: "",
      nameEnglish: "",
      eiin: "",
      phone: "",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (profile) {
      form.reset({
        nameBangla: profile.nameBangla,
        nameEnglish: profile.nameEnglish,
        eiin: profile.eiin,
        phone: profile.phone,
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: InsituteProfileUpdateType) => {
    await handleCrudAction(instituteProfileUpdate, data, {
      successMessage: "Institute profile updated",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["profile", "institute"] });
        setLocked(true);
      },
    });
  };

  const cancelEdit = () => {
    if (profile) {
      form.reset({
        nameBangla: profile.nameBangla,
        nameEnglish: profile.nameEnglish,
        eiin: profile.eiin,
        phone: profile.phone,
      });
    }
    setLocked(true);
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

  return (
    <main className="my-6 w-full max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Institute profile"
        subtitle="The identity shown on mark sheets, results and reports."
        actions={<StatusPill status={profile.status} />}
      />

      {/* only shown when the session actually says the email is unverified */}
      {user && user.emailVerified === false && (
        <RedAlert
          title="Email is not verified"
          description={`Verify ${user.email} to receive result notifications.`}
        />
      )}

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
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Institute details
            </h2>
            <p className="text-xs text-muted-foreground">
              Changing the EIIN affects how the institute is identified.
            </p>
          </div>

          {locked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocked(false)}
              className="cursor-pointer"
            >
              <PencilLine />
              Edit
            </Button>
          )}
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="nameEnglish"
                label="Name (English)"
                placeholder="e.g. Bajitpur Pilot Model High School"
                disabled={locked}
              />
              <FormInput
                control={form.control}
                name="nameBangla"
                label="Name (Bangla)"
                placeholder="প্রতিষ্ঠানের নাম"
                disabled={locked}
              />
              <FormInput
                control={form.control}
                name="eiin"
                label="EIIN"
                placeholder="6 digit EIIN"
                maxLength={6}
                disabled={locked}
              />
              <FormInput
                control={form.control}
                name="phone"
                label="Phone"
                placeholder="01XXXXXXXXX"
                disabled={locked}
              />

              {/* location is captured at onboarding and not edited here */}
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  {profile.upazila}, {profile.district}, {profile.division}
                </p>
              </div>
            </div>

            {!locked && (
              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting && <Spinner />} Save changes
                </Button>
              </div>
            )}
          </form>
        </FormProvider>
      </Card>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
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
              <Mail className="size-4" />
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
        </div>
      </Card>
    </main>
  );
}
