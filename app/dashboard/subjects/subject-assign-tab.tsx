"use client";
import {
  AllowedIdType,
  DynamicCheckboxGroup,
} from "@/components/dashboard/checkbox-group";
import DeleteModal from "@/components/modal/delete-modal";
import { SpinnerCustom } from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import { getGroupClasses } from "@/src/server-actions/groups.action";
import {
  getClassGroup,
  getClassGroupSubject,
} from "@/src/server-actions/subjects.action";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import {
  OutputGroupClassType,
  outputGroupType,
} from "@/src/validation/groups.zod";
import {
  inputSubAssignType,
  outputSubjectType,
  subjectAssignmentZod,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

export function SubjectAssignTab() {
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<OutputGroupClassType[] | undefined>(
    undefined,
  );
  const [subjects, setSubjects] = useState<outputSubjectType[] | undefined>(
    undefined,
  );
  const [classes, setClasses] = useState<classesTypeWithId[] | undefined>(
    undefined,
  );
  const form = useForm<inputSubAssignType>({
    resolver: zodResolver(subjectAssignmentZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;
  const { control } = form;

  useEffect(() => {
    async function getlist() {
      await clientReadAction(getClassGroupSubject, {
        onSuccess: (data) => {
          setClasses(data.getClasses as classesTypeWithId[]);
          // setGroups(data.getGroups as outputGroupType[]);
          setSubjects(data.getSubjects as outputSubjectType[]);
        },
        onLoading: setLoading,
      });

      const info = await getClassGroup();
      if (!info.success) {
        console.log(info.error);
      }

      // await clientReadAction(getClassGroup, {
      //   onSuccess: (data) => console.log(data),
      // });
    }

    getlist();
  }, []);
  console.log(groups);
  // add button
  const addBtn = async (data: inputSubAssignType) => {
    console.log(data);
    // await handleCrudAction(subjectAssignment, data, {
    //   successMessage: "Subjects Assigned Successfully",
    // });
  };

  if (loading) {
    return <SpinnerCustom />;
  }
  return (
    <div>
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
                          {/* <DeleteModal id={item.id} onDelete={deleteSubject} /> */}
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
            Subject Assignment
          </h3>

          {/*  subject assign form */}
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            {/* -----------------Class---------------- */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Classes Name
              </Label>
              <NativeSelect
                {...form.register("classId")}
                className="w-full text-xs h-9 cursor-pointer"
              >
                <NativeSelectOption disabled value="">
                  Select Class
                </NativeSelectOption>
                {classes?.length ? (
                  classes?.map((item) => (
                    <NativeSelectOption key={item.id} value={item.id}>
                      {item.name}
                    </NativeSelectOption>
                  ))
                ) : (
                  <NativeSelectOption disabled value="">
                    No Class available
                  </NativeSelectOption>
                )}
              </NativeSelect>
              {form.formState.errors.classId && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.classId.message}
                </p>
              )}
            </div>

            {/* ----------------Group-------------- */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Group Names
              </Label>
              <NativeSelect
                {...form.register("groupId")}
                className="w-full text-xs h-9 cursor-pointer"
              >
                <NativeSelectOption disabled value="">
                  Select Group
                </NativeSelectOption>
                {groups?.length ? (
                  groups.map((item) => (
                    <NativeSelectOption key={item.id} value={item.id}>
                      {item.name}
                    </NativeSelectOption>
                  ))
                ) : (
                  <NativeSelectOption disabled value="">
                    No groups available
                  </NativeSelectOption>
                )}
              </NativeSelect>
              {form.formState.errors.groupId && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.groupId.message}
                </p>
              )}
            </div>
            {/* ----------------Subject Type-------------- */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Subject Types
              </Label>
              <NativeSelect
                {...form.register("subjectType")}
                className="w-full text-xs h-9 cursor-pointer"
              >
                <NativeSelectOption value="COMPULSORY">
                  COMPULSORY
                </NativeSelectOption>
                <NativeSelectOption value="GROUP_BASED">
                  GROUP_BASED
                </NativeSelectOption>
                <NativeSelectOption value="OPTIONAL">
                  OPTIONAL
                </NativeSelectOption>
              </NativeSelect>
              {form.formState.errors.groupId && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.groupId.message}
                </p>
              )}
            </div>

            {/* --------subjects list-------------- */}
            <div>
              <Controller
                name="subjectIds"
                control={control}
                render={({ field }) => (
                  <DynamicCheckboxGroup
                    legend="Select Subjects"
                    description="Choose the religion subjects to assign."
                    options={subjects ?? []}
                    labelKey="name"
                    valueKey="id"
                    value={field.value} // Connects form value to component
                    onChange={(selectedIds) => field.onChange(selectedIds)} // Syncs selection back to form
                  />
                )}
              />
            </div>

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
