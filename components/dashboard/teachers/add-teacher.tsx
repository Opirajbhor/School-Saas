"use client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getInstituteProfile } from "@/src/server-actions/getInstitituteProfile.action";
import { ProfileType } from "@/src/validation/auth.zod";
import { addTeacherType, addTeacherZod } from "@/src/validation/teacher.zod";

export default function AddTeacher() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const form = useForm<addTeacherType>({
    resolver: zodResolver(addTeacherZod),
    defaultValues: {
      instituteId: profile?.id,
      nameBangla: "",
      nameEnglish: "",
      designation: "",
      mobile: "",
      email: "",
      photoUrl: "",
      gender: "MALE",
      status: "ACTIVE",
    },
  });

  //   get institute info
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
  // ------------------
  const onSubmit = async (data: addTeacherType) => {
    console.log(data);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 px-3 text-xs bg-primary cursor-pointer"
        >
          <Plus />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 sm:max-w-lg gap-0">
        <DialogHeader className="border-b px-6 py-4 pt-5">
          <DialogTitle>Schedule a Meeting</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            (data) => console.log("Success Data:", data),
            (errors) => console.log("Validation Errors:", errors), // 👈 ADD THIS TEMPORARILY
          )}
        >
          <div className="space-y-6 p-6">
            {/* bangla name */}
            <div className="space-y-2">
              <Label>নাম: (বাংলায়)</Label>
              <Input
                {...form.register("nameBangla")}
                placeholder="নাম বাংলায়"
              />
            </div>
            {/* english name */}
            <div className="space-y-2">
              <Label> নাম: (ইংরেজিতে)</Label>
              <Input
                {...form.register("nameEnglish")}
                placeholder="নাম ইংরেজিতে"
              />
            </div>
            {/* designation */}
            <div className="space-y-2">
              <Label>পদবী</Label>
              <Input {...form.register("designation")} placeholder="পদবী" />
            </div>
            {/* mobile */}
            <div className="space-y-2">
              <Label> মোবাইল নম্বর</Label>
              <Input {...form.register("mobile")} placeholder="মোবাইল নম্বর" />
            </div>
            {/* email */}
            <div className="space-y-2">
              <Label> ই-মেইল</Label>
              <Input {...form.register("email")} placeholder="ই-মেইল" />
            </div>

            <div className="col-span-full sm:col-span-3">
              <label className="text-sm font-medium block mb-2">
                লিঙ্গ (Gender)
              </label>

              <div className="flex gap-2">
                {["MALE", "FEMALE", "OTHER"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => form.setValue("gender", g)}
                    className={`px-3 py-1.5 text-xs rounded-md border cursor-pointer transition-all ${
                      form.watch("gender") === g
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-background text-muted-foreground border-input hover:bg-accent"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end border-t p-4 space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button className="cursor-pointer" type="submit" size="sm">
              Add Teacher
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
