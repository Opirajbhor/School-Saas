"use client";
import { SpinnerCustom } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import {
  addSubjects,
  deleteSubject,
  getSubjects,
} from "@/src/server-actions/subjects.action";
import {
  inputSubjectType,
  inputSubjectZod,
  outputSubjectType,
} from "@/src/validation/subjects.zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DeleteModal from "@/components/modal/delete-modal";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Toggle } from "@/components/ui/toggle";
import { MdCheckBox, MdOutlineRadioButtonUnchecked } from "react-icons/md";
import { IoMdCheckmarkCircle } from "react-icons/io";

export default function Page() {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [subjects, setSubjects] = useState<outputSubjectType[] | undefined>(
    undefined,
  );
  useEffect(() => {
    async function getlist() {
      await clientReadAction(getSubjects, {
        onSuccess: (data) => setSubjects(data as outputSubjectType[]),
        onLoading: setLoading,
      });
    }
    getlist();
  }, []);
  const activeSubjects = subjects?.filter((item) => item.status === "ACTIVE");
  const [isReligion, setIsReligion] = useState<boolean>(false);
  const form = useForm<inputSubjectType>({
    resolver: zodResolver(inputSubjectZod),
    defaultValues: {
      status: "ACTIVE",
      isReligion: isReligion,
      religion: null,
    },
  });
  const { isSubmitting } = form.formState;
  // add button
  const addBtn = async (data: inputSubjectType) => {
    const payload = {
      ...data,
      isReligion: isReligion,
      religion: isReligion ? data.religion : null,
    };
    await handleCrudAction(addSubjects, payload, {
      successMessage: "Subject Created Successfully",
      onSuccess: (item) => {
        setSubjects((prev) => [...(prev || []), item as outputSubjectType]);
        form.reset();
        setIsReligion(false);
      },
    });
  };

  if (loading) {
    return <SpinnerCustom />;
  }
  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Subjects Management
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage academic Subjects.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 mb-5 items-center justify-center w-full">
        {/* subjects  stats*/}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Subjects</p>
            <h2 className="mt-2 text-3xl font-bold">{subjects?.length}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Total Active Subjects
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {activeSubjects?.length}
            </h2>
          </CardContent>
        </Card>
      </div>
      {/* ....... */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Data Table Section */}
        <div className="lg:col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
          {/* Table Header/Toolbar */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30">
            <div className="text-lg font-semibold text-foreground flex items-center gap-5">
              Academic Subjects
              <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {subjects?.length} Subjects
              </Badge>
            </div>
          </div>

          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto p-5">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/4">
                    Subject Name
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/4">
                    Code
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/6">
                    ShortForm
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/6">
                    Religion
                  </TableHead>

                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right w-1/6">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right w-1/6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects?.map((item, i) => (
                  <TableRow
                    key={i}
                    className={`${
                      item.status === "ACTIVE"
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/50"
                    } transition-colors group`}
                  >
                    {/* name */}
                    <TableCell className="py-3">
                      <p className={`font-medium $`}>{item.name}</p>
                    </TableCell>

                    {/* code */}
                    <TableCell className="font-medium  text-foreground py-3">
                      <p className={`font-medium $`}>{item.code}</p>
                    </TableCell>
                    {/* shortform */}
                    <TableCell className="font-medium  text-foreground py-3">
                      {item.shortName}
                    </TableCell>
                    <TableCell className="font-medium  text-foreground py-3">
                      {item?.isReligion ? item.religion : "-"}
                    </TableCell>
                    {/* status */}
                    <TableCell className="text-right py-3">
                      <Badge
                        className={`${item.status === "ACTIVE" && "bg-green-50 text-green-700 dark:bg-green-950 dark"} border`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    {/* actions */}
                    <TableCell className="text-right py-3">
                      <div
                        className={`flex items-center justify-end gap-1 transition-opacity`}
                      >
                        <>
                          <DeleteModal
                            id={item.id}
                            onDelete={deleteSubject}
                            onSuccess={() => {
                              form.reset();
                              setSubjects((prev) =>
                                prev?.filter((c) => c?.id !== item?.id),
                              );
                            }}
                          />
                        </>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* <!--  Add subject Form --> */}
        <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Add subject
          </h3>

          {/* add subject form */}
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            {/* name */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Subject Name
              </Label>
              <Input
                {...form.register("name", {
                  required: "Subject name is required",
                })}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., Bangla 1st Paper"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            {/* shortName */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Subject Short Name
              </Label>
              <Input
                {...form.register("shortName", {
                  required: "Subject short name is required",
                })}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., Bng, Eng"
              />
              {form.formState.errors.shortName && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.shortName.message}
                </p>
              )}
            </div>
            {/* code */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Subject Code
              </Label>
              <Input
                {...form.register("code", {
                  required: "Subject code is required",
                })}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., 101, 102"
              />
              {form.formState.errors.code && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>
            {/* toggle */}
            <div>
              <Toggle
                onClick={() => setIsReligion(!isReligion)}
                aria-label="Toggle bookmark"
                size="sm"
                variant="outline"
                className="cursor-pointer"
              >
                {isReligion ? (
                  <IoMdCheckmarkCircle className="group-aria-pressed/toggle:fill-foreground" />
                ) : (
                  <MdOutlineRadioButtonUnchecked className="group-aria-pressed/toggle:fill-foreground" />
                )}
                Religion Subject
              </Toggle>
            </div>
            {/* religion list */}
            <NativeSelect
              {...form.register("religion")}
              className="w-full text-xs h-9 cursor-pointer"
              disabled={!isReligion}
            >
              <NativeSelectOption disabled value="">
                Select Religion
              </NativeSelectOption>
              <NativeSelectOption value="ISLAM">ISLAM</NativeSelectOption>
              <NativeSelectOption value="HINDUISM">HINDUISM</NativeSelectOption>
              <NativeSelectOption value="CHRISTIANITY">
                CHRISTIANITY
              </NativeSelectOption>
              <NativeSelectOption value="BUDDHISM">BUDDHISM</NativeSelectOption>
              <NativeSelectOption value="OTHER">OTHER</NativeSelectOption>
            </NativeSelect>
            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}{" "}
              Add Subject
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
