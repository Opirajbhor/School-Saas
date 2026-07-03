"use client";
import { ClassDetails } from "@/components/dashboard/right-sidebar/class-details";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { getClasses, postClasses } from "@/src/server-actions/classes.action";
import { sessionList } from "@/src/validation/academicSessions.zod";
import { classesType, classesZod } from "@/src/validation/classes.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { toast } from "sonner";

export default function Classes() {
  // get classes and sections
  const [classes, setClasses] = useState<classesType[]>();
  useEffect(() => {
    async function getlist() {
      try {
        const info = await getClasses();
        if (info.success === false) {
          setClasses([]);
          return;
        }
        setClasses(info.data as classesType[]);
      } catch (error) {
        console.error(error);
      }
    }
    getlist();
  }, []);
  // ----------------------------------

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
  const form = useForm<classesType>({
    resolver: zodResolver(classesZod),
    defaultValues: {
      sessionId: "",
      name: "",
      isActive: true,
    },
  });
  const { isSubmitting } = form.formState;

  // add class button
  const addBtn = async (data: classesType) => {
    const res = await postClasses(data);
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
      toast.success("Class created successfully");
      form.reset();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-5 mx-10 my-5">
        <Title title="Classes" />
        <Button
          onClick={() => setOpen(!open)}
          className="gap-1.5 bg-primary cursor-pointer"
          size="sm"
          variant={"outline"}
        >
          {open ? <IoIosArrowUp /> : <IoIosArrowDown />} Add Classes
        </Button>
      </div>
      {open && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(addBtn)}
            action=""
            className="space-y-6 mx-10 border p-5 rounded-2xl"
          >
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
                <Input
                  {...form.register("name")}
                  type="text"
                  required
                  placeholder="e.g. Class 6"
                />
              </Field>

              {/* Session */}
              <FormField
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>

                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Session" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {activeSession.map((item, i) => (
                          <SelectItem key={i} value={item.id}>
                            {item.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

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
        </Form>
      )}

      <div className="flex flex-col items-center p-5">
        <p className="text-x ">Total Clsses : {classes?.length}</p>
        <p className="text-x ">Active Clsses :</p>
        <p className="text-x ">Sections :</p>
      </div>
      <div className="grid grid-cols-4 gap-10 mx-10 my-5">
        {classes?.map((item, i) => (
          <ClassDetails key={i} classData={item} />
        ))}
      </div>

      <div></div>
    </div>
  );
}
