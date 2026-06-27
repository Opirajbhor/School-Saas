"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Key, Lock, User, Shield, Star } from "lucide-react";
import {
  getInstituteProfile,
  instituteProfileUpdate,
} from "@/src/server-actions/getInstitituteProfile.action";
import { useEffect, useState } from "react";
import { Profile } from "@/src/validation/auth.zod";
import { SpinnerCustom } from "@/components/Spinner";
import { CiEdit } from "react-icons/ci";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProfileUpdateType,
  profileUpdateZod,
} from "@/src/validation/profile.zod";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function TabbedUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lock, setLock] = useState<boolean>(true);
  const [btnSpin, setBtnSpin] = useState<boolean>(false);
  // update data of profile
  const form = useForm<ProfileUpdateType>({
    resolver: zodResolver(profileUpdateZod),
    defaultValues: {
      adminNameBangla: profile?.adminNameBangla,
      adminNameEnglish: profile?.adminNameEnglish,
      adminDesignation: profile?.adminDesignation,
      adminPhone: profile?.adminPhone,
    },
  });
  const onSubmit = async (data: ProfileUpdateType) => {
    setBtnSpin(true);
    const res = await instituteProfileUpdate(data);

    if (res?.success) {
      toast.success("successfully updated");
      setLock(true);
    }
    if (!res?.success) {
      toast.error("error in updating");
    }
    setBtnSpin(false);
  };

  useEffect(() => {
    async function getProfile() {
      try {
        const info = await getInstituteProfile();
        if (!info) {
          setProfile(null);
        }
        setProfile(info);
      } catch (error) {
        console.error(error);
      }
    }
    getProfile();
  }, []);
  if (profile === null) {
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
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">
              {profile.instituteNameBangla}
            </h1>
            <p className="text-muted-foreground text-[16px]">
              {profile.instituteNameEnglish}
            </p>
            <p className="text-muted-foreground mt-2 text-[14px]">
              {profile.upazila}, {profile.district}, {profile.division} ।
            </p>
          </div>
        </div>

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

                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* ---------------- */}
                    <div className="space-y-2">
                      <Label>প্রতিষ্ঠান প্রধানের নাম: (বাংলায়)</Label>
                      <Input
                        disabled={lock}
                        defaultValue={profile.adminNameBangla}
                        {...form.register("adminNameBangla")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>প্রতিষ্ঠান প্রধানের নাম: (ইংরেজিতে)</Label>
                      <Input
                        disabled={lock}
                        defaultValue={profile.adminNameEnglish}
                        {...form.register("adminNameEnglish")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>প্রতিষ্ঠান প্রধানের পদবী:</Label>
                      <Input
                        disabled={lock}
                        defaultValue={profile.adminDesignation}
                        {...form.register("adminDesignation")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>প্রতিষ্ঠান প্রধানের ফোন:</Label>
                      <Input
                        disabled={lock}
                        defaultValue={profile.adminPhone}
                        {...form.register("adminPhone")}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={lock}>
                      {btnSpin && <Spinner />} Save Changes
                    </Button>
                  </div>
                </form>
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
