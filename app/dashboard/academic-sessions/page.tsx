"use client";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { session } from "@/src/db/schema";
import {
  acadecmicSession,
  getAcademicSession,
} from "@/src/server-actions/academicSession.action";

import {
  academicSessionType,
  academicSessionZod,
  sessionList,
} from "@/src/validation/academicSessions.zod";
import { Input } from "@base-ui/react/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IoMdCheckmarkCircle } from "react-icons/io";
import { LuCircleEqual } from "react-icons/lu";
import { toast } from "sonner";

export default function SessionPage() {
  const [sessions, setSessions] = useState<sessionList[]>([]);
  const activeSession = sessions.find((item) => item.isActive === true);
  //   get academic sessions info
  useEffect(() => {
    async function getlist() {
      try {
        const info = await getAcademicSession();

        if (info.success === false) {
          setSessions([]);
          return;
        }
        setSessions(info.data as sessionList[]);
      } catch (error) {
        console.error(error);
      }
    }
    getlist();
  }, []);

  const form = useForm<academicSessionType>({
    resolver: zodResolver(academicSessionZod),
    defaultValues: {
      instituteId: "",
      userId: "",
      year: "",
      isActive: false,
    },
  });
  const { isSubmitting } = form.formState;
  const addBtn = async (data: academicSessionType) => {
    const res = await acadecmicSession(data);
    if (res.success === false) {
      if (res.details) {
        const firstErrorField = Object.keys(res.details)[0];
        const messages =
          res.details[firstErrorField as keyof typeof res.details];
        if (messages && messages.length > 0) {
          toast.error(messages[0]);
          return;
        }
      }
      toast.error(res.error || "An unexpected error occurred.");
      return;
    }
    // Handle successful execution path
    if (res.success === true) {
      toast.success("Academic Session created successfully");
      form.reset();
    }
  };

  return (
    <div>
      <form onSubmit={form.handleSubmit(addBtn)}>
        <div className="flex items-center gap-5 mx-10 my-5">
          <Title title="Academic Session" />
          <Input
            className={"border-3 rounded-md h-8 ml-3"}
            type="text"
            placeholder="Year"
            {...form.register("year")}
            required
          />
          <Button
            disabled={isSubmitting}
            type="submit"
            className="gap-1.5 bg-primary cursor-pointer"
            size="sm"
            variant={"outline"}
          >
            {isSubmitting && <Spinner />} <Plus /> Add Session
          </Button>
        </div>
      </form>
      <div className="flex items-center w-full gap-5 mx-5">
        <Card className="w-1/3">
          <CardContent className="[&>svg]:text-muted-foreground flex flex-col items-center [&>svg]:size-7">
            <IoMdCheckmarkCircle className="text-green-400" />

            <CardTitle className="mt-4 mb-3 text-2xl leading-10 font-semibold md:text-xl ">
              {activeSession?.year
                ? activeSession?.year
                : "No Active Session Found"}
            </CardTitle>
            <CardDescription className="text-xl font-medium">
              {"Active Session"}
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="w-1/3">
          <CardContent className="[&>svg]:text-muted-foreground flex flex-col items-center [&>svg]:size-7">
            <LuCircleEqual />

            <CardTitle className="mt-4 mb-3 text-2xl leading-10 font-semibold md:text-3xl lg:text-4xl">
              {sessions?.length}
            </CardTitle>
            <CardDescription className="text-xl font-medium">
              {"Total Sessions"}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <h3 className="text-xl mx-10  my-5">All Sessions</h3>

        <div className="grid grid-cols-2 gap-3 mx-5">
          {!sessions && <h4> No Academic Session found</h4>}

          {sessions.map((item, i) => (
            <Card key={i} className="w-full">
              <CardContent className="[&>svg]:text-muted-foreground flex flex-col items-center [&>svg]:size-7">
                <IoMdCheckmarkCircle className="text-green-400" />

                <CardTitle className="mt-4 mb-3 text-2xl leading-10 font-semibold md:text-3xl lg:text-4xl">
                  {item.year}
                </CardTitle>
                <CardDescription className="text-xl font-medium">
                  {item.isActive}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
