"use client";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  addSubjects,
  deleteSubject,
  getSubjects,
} from "@/src/server-actions/subjects.action";
import { AddSubjectType, addSubjectZod } from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { toast } from "sonner";

type SublistType = AddSubjectType & {
  id: string;
};

export default function Page() {
  const [open, setOpen] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<SublistType[] | undefined>(
    undefined,
  );
  useEffect(() => {
    async function getInfo() {
      const res = await getSubjects();
      if (res.success) {
        setSubjects(res.data);
      }
    }
    getInfo();
  }, []);
  const form = useForm<AddSubjectType>({
    resolver: zodResolver(addSubjectZod),
    defaultValues: {
      name: "",
      isActive: true,
      code: "",
    },
  });
  const { isSubmitting } = form.formState;

  // add subject button
  const addBtn = async (data: AddSubjectType) => {
    try {
      const res = await addSubjects(data);
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
    } catch (error) {}
  };

  // delete subject
  const deleteBtn = async (id: string) => {
    try {
      const res = await deleteSubject(id);
      if (res.success) {
        return toast.success(res.message);
      }
      if (!res.success) {
        return toast.error(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div>
      <div className="flex items-center gap-5 mx-10 my-5">
        <div>
          <Title title="Subjects" />
          <p>Manage all subjects in your institution</p>
        </div>
        <Button
          onClick={() => setOpen(!open)}
          className="gap-1.5 bg-primary cursor-pointer"
          size="sm"
          variant={"outline"}
        >
          {open ? <IoIosArrowUp /> : <IoIosArrowDown />} Add Subjects
        </Button>
        {open && (
          <form
            onSubmit={form.handleSubmit(addBtn)}
            className="space-y-6 mx-10 border p-5 rounded-2xl"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <h1 className="text-xl font-semibold">Create Subject</h1>
                <p className="text-sm text-muted-foreground">
                  Create a new subject for the selected academic session.
                </p>
              </div>

              {/* Subject Name */}
              <Field className="gap-2">
                <FieldLabel>
                  Subject Name <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  {...form.register("name")}
                  type="text"
                  required
                  placeholder="e.g. Bangla 1st Paper"
                />
              </Field>
              {/* Subject code */}
              <Field className="gap-2">
                <FieldLabel>
                  Subject Code <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  {...form.register("code")}
                  type="text"
                  required
                  placeholder="e.g. 101,102"
                />
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
                  Add Subject
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
      <div className="flex flex-col items-center p-5">
        <p className="text-x ">Total subject : {subjects?.length}</p>
      </div>
      <div className="grid grid-cols-3  mx-10 ">
        {subjects?.map((item, i) => (
          <h3
            onClick={() => deleteBtn(item.id)}
            className="border-2 p-10 text-2xl cursor-pointer"
            key={i}
          >
            {item.name} <span>{item.code}</span>
          </h3>
        ))}
      </div>
    </div>
  );
}
