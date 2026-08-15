"use client";
import { SpinnerCustom } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";

import {
  addGroupZod,
  inputGroupType,
  outputGroupType,
} from "@/src/validation/groups.zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import DeleteModal from "@/components/modal/delete-modal";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createGroup,
  deleteGroup,
  getGroups,
} from "@/src/server-actions/groups.action";
import { classesTypeWithId } from "@/src/validation/classes.zod";
import { getClasses } from "@/src/server-actions/classes.action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AssignGroups from "./assign-groups";

export default function Page() {
  const [loading, setLoading] = useState<boolean>(true);

  const [groups, setGroups] = useState<outputGroupType[] | undefined>(
    undefined,
  );
  useEffect(() => {
    async function getlist() {
      await clientReadAction(getGroups, {
        onSuccess: (data) => setGroups(data as outputGroupType[]),
        onLoading: setLoading,
      });
    }
    getlist();
  }, []);
  const activegroups = groups?.filter((item) => item.status === true);
  const form = useForm<inputGroupType>({
    resolver: zodResolver(addGroupZod),
    defaultValues: {
      status: true,
    },
  });
  const { isSubmitting } = form.formState;
  // add button
  const addBtn = async (data: inputGroupType) => {
    await handleCrudAction(createGroup, data, {
      successMessage: "Group Created Successfully",
      onSuccess: (items) => {
        setGroups((prev) => [...(prev || []), items as outputGroupType]);
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
            Group Management
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage Academic Groups.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5 mb-5 items-center justify-center w-full">
        {/* groups  stats*/}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Groups</p>
            <h2 className="mt-2 text-3xl font-bold">{groups?.length}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Active Groups</p>
            <h2 className="mt-2 text-3xl font-bold">{activegroups?.length}</h2>
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
              Academic groups
              <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {groups?.length} groups
              </Badge>
            </div>
          </div>

          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/4">
                    Group Name
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider text-center">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider text-center">
                    Assigned Classes
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups?.map((item, i) => (
                  <TableRow
                    key={i}
                    className={`${
                      item?.status === true
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/50"
                    } transition-colors`}
                  >
                    <TableCell className="py-3 font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge
                        variant={item.status ? "default" : "secondary"}
                        className={
                          item.status ? "bg-green-100 text-green-800" : ""
                        }
                      >
                        {item.status ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-center font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <AssignGroups group={item} />
                        <DeleteModal
                          id={item.id}
                          onDelete={deleteGroup}
                          onSuccess={() => {
                            form.reset();
                            setGroups((prev) =>
                              prev?.filter((c) => c?.id !== item?.id),
                            );
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* <!--  Add Group Form --> */}
        <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Add Group
          </h3>

          {/* add Group form */}
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            {/* name */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Group Name
              </Label>
              <Input
                {...form.register("name", {
                  required: "Group name is required",
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

            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}{" "}
              Add Group
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// select groups
{
  {
    /* class list */
  }
  // <Controller
  //   name="classList"
  //   control={form.control}
  //   render={({ field }) => (
  //     <Select
  //       multiple
  //       value={field.value || []}
  //       onValueChange={field.onChange}
  //     >
  //       <SelectTrigger className="w-full">
  //         <SelectValue placeholder="Select classes">
  //           {/* Show names instead of IDs */}
  //           {field.value?.length > 0
  //             ? classes
  //                 ?.filter((c) => field.value.includes(c.id!))
  //                 .map((c) => c.name)
  //                 .join(", ")
  //             : "Select classes"}
  //         </SelectValue>
  //       </SelectTrigger>
  //       <SelectContent>
  //         {classes?.map((item) => (
  //           <SelectItem key={item.id} value={item.id}>
  //             {item.name}
  //           </SelectItem>
  //         ))}
  //       </SelectContent>
  //     </Select>
  //   )}
  // />
}
