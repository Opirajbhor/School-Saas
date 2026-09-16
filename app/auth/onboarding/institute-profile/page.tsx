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
export default function InstituteProfilePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  if (session?.session.token) router.push("/dashboard");

  const form = useForm<InstituteInput>({
    resolver: zodResolver(instituteZod),
    defaultValues: {},
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
  console.log(selectedDistrict);

  //   upazila
  const upazila = bd_upazilas.upazilas.filter(
    (item) => item.district_id === selectedDistrict,
  );
  const handleCreate = async (data: InstituteInput) => {
    console.log(data);
  };

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
              />
              {/*----------- bangla name -----------*/}
              <FormInput
                control={form.control}
                label="Institute Bangla Name"
                name="nameBangla"
                placeholder="e.g. "
              />

              {/*---------- English Name -----------*/}
              <FormInput
                control={form.control}
                label="Institute English Name"
                name="nameEnglish"
                placeholder="Enter your Institute English Name"
              />
              {/*---------- phone-----------*/}
              <FormInput
                control={form.control}
                label="Institute Phone Number"
                name="phone"
                placeholder="Enter your Institute Phone Number"
              />
              {/*---------- division-----------*/}
              <FormSelect
                control={form.control}
                name="division"
                label="Division Name"
                options={
                  bd_divisions?.divisions.map((item) => ({
                    label: item.name,
                    value: item.name,
                  })) ?? []
                }
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
                    value: item.name,
                  })) ?? []
                }
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
                    value: item.name,
                  })) ?? []
                }
              />

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
