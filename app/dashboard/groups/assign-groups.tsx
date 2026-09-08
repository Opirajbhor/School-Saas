"use client";
import { ArrowBigRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getClasses } from "@/src/server-actions/classes.action";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import {
  AssignGroupClassType,
  assignGroupClassZod,
  OutputGroupClassType,
} from "@/src/validation/groups.zod";
import { assignGroupClasses } from "@/src/server-actions/groups.action";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCheckboxGroup } from "@/components/forms/form-checkbox-group";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function AssignGroups({
  group,
}: {
  group: OutputGroupClassType;
}) {
  const [open, setOpen] = useState(false);
  // ------------- query fn ---------------
  const queryClient = useQueryClient();
  const { data: classes = [] } = useQuery<classesTypeWithId[]>({
    queryKey: ["page-groups", "classes"],
    queryFn: async () => {
      const result = await getClasses();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as classesTypeWithId[];
    },
  });

  const form = useForm<AssignGroupClassType>({
    resolver: zodResolver(assignGroupClassZod),
    defaultValues: {
      groupId: group.id,
      classIds: [],
    },
  });

  const { isSubmitting } = form.formState;
  const selectedClasses = useWatch({
    control: form.control,
    name: "classIds",
  });

  const handleSubmit = async (data: AssignGroupClassType) => {
    await handleCrudAction(assignGroupClasses, data, {
      successMessage: "Classes Assigned Successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["groups"],
        });
        form.reset({
          groupId: group.id,
          classIds: [],
        });
        setOpen(false);
      },
    });
  };

  // modal
  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      form.reset({
        groupId: group.id,
        classIds: group.groupClasses.map((item) => item.classId),
      });

      return;
    }
    form.reset({
      groupId: group.id,
      classIds: [],
    });
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 px-3 text-xs bg-primary cursor-pointer"
        >
          Assign
          <ArrowBigRight className="h-3 w-3 ml-1" />
        </Button>
      </DialogTrigger>

      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="p-0 sm:max-w-lg gap-0"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Assign {group.name} to Classes</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4 p-6">
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                <FormCheckboxGroup
                  control={form.control}
                  name="classIds"
                  label="Select classes"
                  options={classes
                    .filter(
                      (item): item is typeof item & { id: string } => !!item.id,
                    )
                    .map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                />
              </div>

              {form.formState.errors.classIds && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.classIds.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                {selectedClasses.length} class(es) selected
              </p>
              {/* -------------handle submit button---------------- */}
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>

                <Button
                  disabled={isSubmitting}
                  className="cursor-pointer"
                  type="submit"
                  size="sm"
                >
                  {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                  Assign
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
