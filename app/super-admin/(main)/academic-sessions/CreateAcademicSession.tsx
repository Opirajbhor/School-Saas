"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  academicSessionType,
  academicSessionZod,
} from "@/src/validation/academicSessions.zod";
import { Input } from "@base-ui/react/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import { createAcademicSession } from "./_actions/academicSession.action";

export default function CreateAcademicSession() {
  // RHF
  const form = useForm<academicSessionType>({
    resolver: zodResolver(academicSessionZod),
    defaultValues: {
      year: "",
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;

  // add button
  const addBtn = async (data: academicSessionType) => {
    await handleCrudAction(createAcademicSession, data, {
      successMessage: "Session Created Successfully",
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Academic Sessions
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage school years, terms, and active sessions.
          </p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* <!--  Add session Form --> */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Add Session
          </h3>

          {/* add session form */}
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Academic Session Name
              </Label>
              <Input
                {...form.register("year", {
                  required: "Session name is required",
                })}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., 2026"
              />
              {form.formState.errors.year && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.year.message}
                </p>
              )}
            </div>

            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}{" "}
              Add Session
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
