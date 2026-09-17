"use client";
import { PiShieldChevronBold } from "react-icons/pi";
import Link from "next/link";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { InstituteInput, instituteZod } from "@/src/validation/auth.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/forms/form-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { authClient } from "@/src/better-auth/auth-client";
import { useRouter } from "next/navigation";
import { FormSelect } from "@/components/forms/form-select";
import bd_divisions from "@/src/data/bd-geo-location/bd-division.json";
import bd_districts from "@/src/data/bd-geo-location/bd-districts.json";
import bd_upazilas from "@/src/data/bd-geo-location/bd-upazilas.json";
import { useEffect } from "react";
import { SpinnerCustom } from "@/components/Spinner";
import { instituteProfileAction } from "@/src/server-actions/auth/signup.action";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (session?.user.role === "user") {
      router.push("/dashboard");
    }
  }, [session, router]);
  console.log(session);
  const form = useForm<InstituteInput>({
    resolver: zodResolver(instituteZod),
    defaultValues: {
      logo: null,
    },
  });
  const { isSubmitting } = form.formState;
  //   division
  const selectedDivision = useWatch({
    control: form.control,
    name: "division",
  });
  //   district
  const districts = bd_districts.districts.filter(
    (item) => item.division_id === selectedDivision,
  );
  const selectedDistrict = useWatch({
    control: form.control,
    name: "district",
  });

  //   upazila
  const upazila = bd_upazilas.upazilas.filter(
    (item) => item.district_id === selectedDistrict,
  );
  const handleCreate = async (data: InstituteInput) => {
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
      // router.push("/auth/onboarding/admin-profile");
    }
    if (!result.success) {
      console.log(result.error);
      toast.error(result.error || "Error creating institute profile");
    }
  };

  if (isPending) return <SpinnerCustom />;
  return (
    <div className="flex flex-col p-6">
      {/* Logo */}
      <div className="flex justify-center gap-2 md:justify-start">
        <Link
          href="/"
          aria-label="home"
          className="flex gap-1 items-center space-x-2"
        >
          <PiShieldChevronBold size={30} />
          Educare
        </Link>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p>Step-02</p>

        <h1 className="text-2xl font-bold">Enter Your Institute Information</h1>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-lvh">
          <FormProvider {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleCreate)}
            >
              {/* ------- Eiin ----------- */}
              <FormInput
                control={form.control}
                label="Institute EIIN"
                name="eiin"
                placeholder="e.g., 000000"
                description={form.formState.errors.eiin?.message}
              />
              {/*----------- bangla name -----------*/}
              <FormInput
                control={form.control}
                label="Institute Bangla Name"
                name="nameBangla"
                placeholder="e.g. "
                description={form.formState.errors.nameBangla?.message}
              />

              {/*---------- English Name -----------*/}
              <FormInput
                control={form.control}
                label="Institute English Name"
                name="nameEnglish"
                placeholder="Enter your Institute English Name"
                description={form.formState.errors.nameEnglish?.message}
              />
              {/*---------- phone-----------*/}
              <FormInput
                control={form.control}
                label="Institute Phone Number"
                name="phone"
                type="number"
                placeholder="Enter your Institute Phone Number"
                description={form.formState.errors.phone?.message}
              />
              {/*---------- division-----------*/}
              <div className="flex items-center justify-left gap-5">
                <FormSelect
                  control={form.control}
                  name="division"
                  label="Division Name"
                  options={
                    bd_divisions?.divisions.map((item) => ({
                      label: item.name,
                      value: item.id,
                    })) ?? []
                  }
                  description={form.formState.errors.division?.message}
                />
                {/*---------- district-----------*/}
                <FormSelect
                  control={form.control}
                  name="district"
                  label="District Name"
                  disabled={!selectedDivision}
                  options={
                    districts.map((item) => ({
                      label: item.name,
                      value: item.id,
                    })) ?? []
                  }
                  description={form.formState.errors.district?.message}
                />
                {/*---------- upazila-----------*/}
                <FormSelect
                  control={form.control}
                  name="upazila"
                  label="Upazila Name"
                  disabled={!selectedDivision || !selectedDistrict}
                  options={
                    upazila.map((item) => ({
                      label: item.name,
                      value: item.id,
                    })) ?? []
                  }
                  description={form.formState.errors.upazila?.message}
                />
              </div>

              {/* -------submit button------------- */}
              <Button disabled={isSubmitting} variant="default" type="submit">
                {isSubmitting ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Account
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
