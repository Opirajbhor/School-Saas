"use client";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getAcademicSession } from "@/src/server-actions/academicSession.action";
import {
  academicSessionType,
  academicSessionZod,
  sessionList,
} from "@/src/validation/academicSessions.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Classes() {
  // get all active sessions
  const [sessions, setSessions] = useState<sessionList[]>([]);
  const activeSession = sessions.filter((item) => item.isActive === true);
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
  // ------------------------------------
  const [open, setOpen] = useState<boolean>(false);
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

  return (
    <div>
      <div className="flex items-center gap-5 mx-10 my-5">
        <Title title="Classes" />
        <Button
          disabled={isSubmitting}
          type="submit"
          className="gap-1.5 bg-primary cursor-pointer"
          size="sm"
          variant={"outline"}
        >
          {isSubmitting && <Spinner />} <Plus /> Add Classes
        </Button>
      </div>

      <form action="" className="space-y-6 mx-10 border p-5">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <h1 className="text-xl font-semibold">Create Class</h1>
            <p className="text-sm text-muted-foreground">
              Create a new class for the selected academic session.
            </p>
          </div>

          {/* Class Name */}
          <Field className="gap-2">
            <FieldLabel>
              Class Name <span className="text-red-500">*</span>
            </FieldLabel>
            <Input type="text" required placeholder="e.g. Class 6" />
          </Field>

          {/* Session */}
          <Field className="gap-2">
            <FieldLabel>
              Academic Session <span className="text-red-500">*</span>
            </FieldLabel>

            <Select defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>

              <SelectContent>
                {activeSession?.map((item: sessionList) => (
                  <SelectItem key={item.id} value={item.year}>
                    {item.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex justify-end">
            <Button
              disabled={isSubmitting}
              type="submit"
              className="gap-2"
              size="sm"
            >
              {isSubmitting && <Spinner />}
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
