"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Key, Lock, User, Shield, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { InstituteOutput } from "@/src/validation/auth.zod";
import { SpinnerCustom } from "@/components/Spinner";
import { CiEdit } from "react-icons/ci";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InsituteProfileUpdateType,
  insituteProfileUpdateZod,
} from "@/src/validation/institute-profile.zod";
import { Spinner } from "@/components/ui/spinner";
import RedAlert from "@/components/dashboard/alert-notice/red-alert";
import { sessionUserType } from "@/src/server-actions/auth/currentUser.action";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInstituteProfile,
  instituteProfileUpdate,
} from "@/src/server-actions/shared/get-user-profile.action";
import { FormInput } from "@/components/forms/form-input";
import { authClient } from "@/src/better-auth/auth-client";

export default function TabbedUserProfile() {
  const [lock, setLock] = useState<boolean>(true);
  const { data: user } = authClient.useSession();

  // ------------- query fn ---------------
  const queryClient = useQueryClient();
  const { data: profile, isPending } = useQuery<InstituteOutput>({
    queryKey: ["profile", "institute"],
    queryFn: async () => {
      const result = await getInstituteProfile();
      if (!result) {
        throw new Error("can not get institute profile");
      }
      return result.institute as InstituteOutput;
    },
  });
  // update data of profile
  const form = useForm<InsituteProfileUpdateType>({
    resolver: zodResolver(insituteProfileUpdateZod),
    defaultValues: {
      nameBangla: profile?.nameBangla ?? "",
      nameEnglish: profile?.nameEnglish ?? "",
      eiin: profile?.eiin ?? "",
      phone: profile?.phone ?? "",
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
  //  update button
  const onSubmit = async (data: InsituteProfileUpdateType) => {
    await handleCrudAction(instituteProfileUpdate, data, {
      successMessage: "Updated Successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["profile", "institute"] });
      },
    });
  };

  if (!profile || isPending) {
    return <SpinnerCustom />;
  }
  const editButton = () => {
    setLock(!lock);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 2xl:max-w-350">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-6">
          <Avatar className="size-20">
            <AvatarImage src={"https://github.com/shadcn.png"} alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{profile?.nameBangla}</h1>
            <p className="text-muted-foreground text-[16px]">
              {profile?.nameEnglish}
            </p>
            <p className="text-muted-foreground mt-2 text-[14px]">
              {profile?.upazila}, {profile?.district}, {profile?.division} ।
            </p>
          </div>
        </div>
        {!user?.user?.emailVerified && (
          <div className="mb-5">
            <RedAlert
              title="Account is not verified!"
              description={`Please verify your account. ${user?.user?.email}`}
            />
          </div>
        )}
        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="h-auto w-full justify-start gap-6 bg-transparent p-0">
            {/* profile */}
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="mr-2 size-4" />
              Profile
            </TabsTrigger>
            {/* security */}
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Lock className="mr-2 size-4" />
              Security
            </TabsTrigger>
          </TabsList>
          {/* profile content */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="mb-4 text-lg font-semibold">
                    Profile Details
                  </h2>
                  <Button
                    onClick={editButton}
                    variant="outline"
                    className="cursor-pointer "
                  >
                    <CiEdit /> Edit
                  </Button>
                </div>
                <FormProvider {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormInput
                        control={form.control}
                        name="nameEnglish"
                        label="Institute English Name"
                        placeholder="Enter English name"
                        disabled={lock}
                        description={form.formState.errors.nameEnglish?.message}
                      />
                      <FormInput
                        control={form.control}
                        name="nameBangla"
                        label="Institute Bangla Name"
                        placeholder="Enter Bangla name"
                        disabled={lock}
                        description={form.formState.errors.nameBangla?.message}
                      />
                      <FormInput
                        control={form.control}
                        name="eiin"
                        label="Institute EIIN Name"
                        placeholder="Enter EIIN"
                        disabled={lock}
                        description={form.formState.errors.eiin?.message}
                      />

                      <FormInput
                        control={form.control}
                        name="phone"
                        label="Institute Phone"
                        placeholder="Enter Phone"
                        disabled={lock}
                        description={form.formState.errors.phone?.message}
                      />
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button type="submit" disabled={lock}>
                        {isSubmitting && <Spinner />} Save Changes
                      </Button>
                    </div>
                  </form>
                </FormProvider>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Connected Accounts
                </h2>
                <div className="space-y-4">
                  {["GitHub", "Google", "Twitter"].map((provider) => (
                    <div
                      key={provider}
                      className="flex flex-col items-start justify-between gap-4 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                          <Star className="text-muted-foreground size-5" />
                        </div>
                        <div>
                          <p className="font-medium">{provider}</p>
                          <p className="text-muted-foreground text-sm">
                            {provider === "GitHub"
                              ? "Connected"
                              : "Not Connected"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={provider === "GitHub" ? "outline" : "default"}
                      >
                        {provider === "GitHub" ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* security  content----- */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Security Settings
                </h2>
                <div className="space-y-6">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-muted-foreground text-sm">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">
                      <Shield className="mr-2 size-4" />
                      Enable
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <p className="font-medium">Password</p>
                        <p className="text-muted-foreground text-sm">
                          Last changed 3 months ago
                        </p>
                      </div>
                      <Button variant="outline">
                        <Key className="mr-2 size-4" />
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Active Sessions</h2>
                <div className="space-y-4">
                  {[
                    {
                      device: "MacBook Pro",
                      location: "San Francisco, CA",
                      lastActive: "Active now",
                      current: true,
                    },
                    {
                      device: "iPhone 12",
                      location: "New York, NY",
                      lastActive: "2 days ago",
                      current: false,
                    },
                  ].map((session, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{session.device}</p>
                          {session.current && (
                            <Badge variant="secondary">Current</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
