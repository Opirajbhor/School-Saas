"use client";
import { ArrowBigRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import { getClasses } from "@/src/server-actions/classes.action";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import {
  AssignGroupClassType,
  assignGroupClassZod,
  OutputGroupClassType,
} from "@/src/validation/groups.zod";
import {
  assignGroupClasses,
  getActiveAssignClasses,
} from "@/src/server-actions/groups.action";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { FormCheckboxGroup } from "@/components/forms/form-checkbox-group";

export default function AssignGroups({
  group,
}: {
  group: OutputGroupClassType;
}) {
  const [classes, setClasses] = useState<classesTypeWithId[]>([]);
  const [open, setOpen] = useState(false);
  // ------fetch class data----------
  useEffect(() => {
    async function getList() {
      await clientReadAction(getClasses, {
        onSuccess: (data) => {
          setClasses(data as classesTypeWithId[]);
        },
      });
      await clientReadAction(getActiveAssignClasses, {
        onSuccess: (data) => {
          console.log(data);
        },
      });
    }
    getList();
  }, []);

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
  const methods = useForm();

  const handleSubmit = async (data: AssignGroupClassType) => {


    await handleCrudAction(assignGroupClasses, data, {
      successMessage: "Classes Assigned Successfully",
      onSuccess: () => {
        form.reset({
          groupId: group.id,
          classIds: [],
        });
        setOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
        <FormProvider {...methods}>
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
