"use client";
import { ClassDetails } from "@/components/dashboard/class-section/class-details";
import DeleteModal from "@/components/modal/delete-modal";
import { SpinnerCustom } from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import {
  deleteClass,
  getClasses,
  postClasses,
} from "@/src/server-actions/classes.action";
import {
  classesType,
  classesTypeWithId,
  classesZod,
} from "@/src/validation/classes.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Classes() {
  const [loading, setLoading] = useState<boolean>(true);
  const [classes, setClasses] = useState<classesTypeWithId[]>();
  const allSections = classes?.flatMap((cls) => cls.sections || []) ?? [];

  // get classes and sections
  useEffect(() => {
    async function getlist() {
      await clientReadAction(getClasses, {
        onSuccess: (data) => setClasses(data as classesTypeWithId[]),
        onLoading: setLoading,
      });
    }
    getlist();
  }, []);
  // RHF
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
    await handleCrudAction(postClasses, data, {
      successMessage: "Class created successfully",
      onSuccess: (newClass) => {
        setClasses((prev) => [...(prev || []), newClass]);
        form.reset();
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
            Classes & Sections Management
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage academic classes, sections.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 mb-5 items-center justify-center w-full">
        {/* class  stats*/}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Classes</p>
            <h2 className="mt-2 text-3xl font-bold">{classes?.length}</h2>
          </CardContent>
        </Card>
        {/* sections stats*/}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Sections</p>
            <h2 className="mt-2 text-3xl font-bold">{allSections?.length}</h2>
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
              Academic Classes
              <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {classes?.length} Classes
              </Badge>
            </div>
          </div>

          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto p-5">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/4">
                    Class Name
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/4">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/6">
                    Sections
                  </TableHead>

                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right w-1/6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((item, i) => (
                  <TableRow
                    key={i}
                    className={`${
                      item.isActive
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/50"
                    } transition-colors group`}
                  >
                    {/* name */}
                    <TableCell className="py-3">
                      <div className={`font-medium $`}>{item.name}</div>
                    </TableCell>
                    {/* status */}
                    <TableCell className="py-3">
                      <Badge
                        className={`${item.isActive ? "bg-green-600" : "bg-gray-400"} border`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full bg-primary/5 hover:bg-primary/10 mr-1.5 inline-block`}
                        >
                          *
                        </span>
                        {item.isActive ? "Active" : "Completed"}
                      </Badge>
                    </TableCell>
                    {/* total sections */}
                    <TableCell className="font-medium flex items-center gap-2 text-foreground py-3">
                      <Badge variant="secondary">{item.sections?.length}</Badge>
                      <Badge variant="outline">
                        {item.sections
                          ?.slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((s) => s.name)
                          .join(", ")}
                      </Badge>
                    </TableCell>
                    {/* actions */}
                    <TableCell className="text-right py-3">
                      <div
                        className={`flex items-center justify-end gap-1 transition-opacity`}
                      >
                        <>
                          <ClassDetails
                            classData={item}
                            setClasses={setClasses}
                          />

                          <DeleteModal
                            id={item.id!}
                            onDelete={deleteClass}
                            onSuccess={() => {
                              form.reset();
                              setClasses((prev) =>
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
        {/* <!--  Add session Form --> */}
        <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Add Class
          </h3>

          {/* add session form */}
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Create Class
              </Label>
              <Input
                {...form.register("name", {
                  required: "Class name is required",
                })}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., 2026"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}{" "}
              Add Class
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
