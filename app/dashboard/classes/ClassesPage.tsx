"use client";
import { SpinnerCustom } from "@/components/Spinner";
import { DataTable } from "@/components/table/tanstack/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import {
  classesType,
  classesTypeWithId,
  classesZod,
} from "@/src/validation/classes.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { useForm } from "react-hook-form";
import { columns } from "./_table/columns";
import { getClasses, postClasses } from "./_actions/classes.action";

export default function ClassesPage() {
  // get classes and sections
  const queryClient = useQueryClient();
  const { data: classes = [], isPending } = useQuery<classesTypeWithId[]>({
    queryKey: ["classes", "sections"],
    queryFn: async () => {
      const result = await getClasses();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as classesTypeWithId[];
    },
  });
  const allSections = classes?.flatMap((cls) => cls.sections || []) ?? [];

  // RHF
  const form = useForm<classesType>({
    resolver: zodResolver(classesZod),
    defaultValues: {
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;
  // add class button
  const addBtn = async (data: classesType) => {
    await handleCrudAction(postClasses, data, {
      successMessage: "Class created successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["classes", "sections"],
        });
        form.reset();
      },
    });
  };

  if (isPending) {
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Data Table Section */}
        <div className="lg:col-span-4">
          <DataTable columns={columns} data={classes} />
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
