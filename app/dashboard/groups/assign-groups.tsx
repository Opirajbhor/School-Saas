"use client";
import { ArrowBigRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
  outputGroupType,
} from "@/src/validation/groups.zod";
import { assignGroupClasses } from "@/src/server-actions/groups.action";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

export default function AssignGroups({ group }: { group: outputGroupType }) {
  const [classes, setClasses] = useState<classesTypeWithId[]>([]);
  const [open, setOpen] = useState(false);

  const form = useForm<AssignGroupClassType>({
    resolver: zodResolver(assignGroupClassZod),
    defaultValues: {
      groupId: group.id,
      classIds: [],
    },
  });

  const { isSubmitting } = form.formState;
  const selectedClasses = form.watch("classIds");

  useEffect(() => {
    async function getList() {
      await clientReadAction(getClasses, {
        onSuccess: (data) => {
          setClasses(data as classesTypeWithId[]);
        },
      });
    }

    getList();
  }, []);

  const handleToggleClass = (classId: string) => {
    const current = form.getValues("classIds");

    form.setValue(
      "classIds",
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const handleSubmit = async (data: AssignGroupClassType) => {
    await handleCrudAction(assignGroupClasses, data, {
      successMessage: "Classes Assigned Successfully",

      onSuccess: () => {
        form.reset({
          groupId: group.id,
          classIds: [],
        });

        setOpen(false);
      },
    });
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      form.reset({
        groupId: group.id,
        classIds: [],
      });
    }
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

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 p-6">
            <Label className="text-sm font-medium">Select Classes</Label>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {classes.length > 0 ? (
                classes.map((classItem) => {
                  const isSelected = selectedClasses.includes(classItem.id);

                  return (
                    <div
                      key={classItem.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected && "bg-muted border-primary",
                      )}
                      onClick={() => handleToggleClass(classItem.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleClass(classItem.id);
                        }
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleClass(classItem.id)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <span className="text-sm">{classItem.name}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No classes available
                </p>
              )}
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

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                disabled={isSubmitting || selectedClasses.length === 0}
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
      </DialogContent>
    </Dialog>
  );
}
