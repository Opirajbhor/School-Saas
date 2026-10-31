"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { InstituteInput, instituteZod } from "@/src/validation/auth.zod";
import { instituteProfileAction } from "@/src/server-actions/auth/signup.action";
import { authClient } from "@/src/better-auth/auth-client";

import bd_divisions from "@/src/data/bd-geo-location/bd-division.json";
import bd_districts from "@/src/data/bd-geo-location/bd-districts.json";
import bd_upazilas from "@/src/data/bd-geo-location/bd-upazilas.json";

export default function Page() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // an admin that already finished onboarding has no business here
  useEffect(() => {
    if (session?.user.role === "user") router.push("/dashboard");
  }, [session, router]);

  const form = useForm<InstituteInput>({
    resolver: zodResolver(instituteZod),
    defaultValues: { logo: null },
  });
  const { isSubmitting } = form.formState;

  const selectedDivision = useWatch({
    control: form.control,
    name: "division",
  });
  const districts = bd_districts.districts.filter(
    (item) => item.division_id === selectedDivision,
  );

  const selectedDistrict = useWatch({
    control: form.control,
    name: "district",
  });
  const upazilas = bd_upazilas.upazilas.filter(
    (item) => item.district_id === selectedDistrict,
  );

  const handleCreate = async (data: InstituteInput) => {
    // the selects hold ids; the record stores names
    const divisionName =
      bd_divisions.divisions.find((d) => d.id === data.division)?.name ?? "";
    const districtName =
      bd_districts.districts.find((d) => d.id === data.district)?.name ?? "";
    const upazilaName =
      bd_upazilas.upazilas.find((u) => u.id === data.upazila)?.name ?? "";

    const result = await instituteProfileAction({
      ...data,
      division: divisionName,
      district: districtName,
      upazila: upazilaName,
    });

    if (result.success) {
      router.push("/auth/onboarding/admin-profile");
      return;
    }

    toast.error("Could not save the institute", {
      description: result.error || "Check the EIIN and try again.",
    });
  };

  if (isPending) {
    return (
      <AuthShell>
        <PageSkeleton rows={4} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Step 2 of 3
          </span>
          <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
            Institute details
          </h1>
          <p className="text-sm text-muted-foreground">
            As registered with the education board — these show on every result.
          </p>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="eiin"
                label="EIIN"
                placeholder="110245"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />

              {/* tel, not number: a BD number starts with 0 and a number input
                  strips it */}
              <FormInput
                control={form.control}
                name="phone"
                label="Phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
                maxLength={11}
              />

              <div className="sm:col-span-2">
                <FormInput
                  control={form.control}
                  name="nameEnglish"
                  label="Name (English)"
                  placeholder="e.g. Bajitpur Pilot Model High School"
                />
              </div>

              <div className="sm:col-span-2">
                <FormInput
                  control={form.control}
                  name="nameBangla"
                  label="Name (Bangla)"
                  placeholder="প্রতিষ্ঠানের নাম"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormSelect
                control={form.control}
                name="division"
                label="Division"
                options={
                  bd_divisions?.divisions.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })) ?? []
                }
              />

              <FormSelect
                control={form.control}
                name="district"
                label="District"
                disabled={!selectedDivision}
                options={districts.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
              />

              <FormSelect
                control={form.control}
                name="upazila"
                label="Upazila"
                disabled={!selectedDivision || !selectedDistrict}
                options={upazilas.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Continue
            </Button>
          </form>
        </FormProvider>
      </div>
    </AuthShell>
  );
}
