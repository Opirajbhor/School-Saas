"use client";
import { SpinnerCustom } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import {
  addSubjects,
  getSubjects,
  ToggleSubjectStatus,
} from "@/src/server-actions/subjects.action";
import {
  InputSubjectType,
  inputSubjectZod,
  OutputSubjectType,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { SubjectAssignTab } from "./subject-assign-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { AppTable } from "@/components/table/data-table";
import StatusToggleModal from "@/components/modal/status-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormCheckbox } from "@/components/forms/form-checkbox";

export default function Page() {
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

  // ------------- query fn ---------------
  const queryClient = useQueryClient();
  const { data: subjects = [], isPending } = useQuery<OutputSubjectType[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const result = await getSubjects();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as OutputSubjectType[];
    },
  });
  const activeSubjects = subjects?.filter((item) => item.status === "ACTIVE");

  // -------------- form -------------------
  const form = useForm<InputSubjectType>({
    resolver: zodResolver(inputSubjectZod),
    defaultValues: {
      isOptional: false,
      isReligion: false,
      religion: null,
      status: "ACTIVE",
    },
  });
  const { isSubmitting } = form.formState;
  const subType = useWatch({
    control: form.control,
    name: "subject_type",
  });
  // add button
  const addBtn = async (data: InputSubjectType) => {
    await handleCrudAction(addSubjects, data, {
      successMessage: "Subject Created Successfully",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["subjects"],
        });
      },
    });
  };

  // reset the form value if sub type changes
  useEffect(() => {
    form.setValue("isOptional", false);
    form.setValue("religion", null);
  }, [subType, form]);
  if (isPending) {
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
      {/* <SubjectAssignTab /> */}
      <Tabs defaultValue="subject">
        <TabsList>
          <TabsTrigger value="subject" className=" w-full cursor-pointer">
            Subject Management
          </TabsTrigger>
          <TabsTrigger value="subject-assign" className="cursor-pointer">
            Subject Assignments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="subject">
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

              {/*---------- Responsive Table Wrapper -------------*/}

              <AppTable
                data={subjects ?? []}
                searchable
                searchPlaceholder="Search Subjects..."
                searchKeys={["name", "code", "shortName"]}
                selectable
                selectedIds={selectedSub}
                onSelectionChange={setSelectedSub}
                toolbar={
                  <>
                    <Button variant="outline">Export</Button>
                  </>
                }
                columns={[
                  {
                    key: "name",
                    label: "Subject Name",
                  },

                  {
                    key: "shortName",
                    label: "Short Name",
                  },

                  {
                    key: "code",
                    label: "Subject Code",
                  },

                  {
                    key: "religion",
                    label: "Religion",
                  },

                  {
                    key: "status",
                    label: "Status",
                    render: (item) =>
                      item.status === "ACTIVE" ? (
                        <Badge variant="default">ACTIVE</Badge>
                      ) : (
                        <span className="text-muted-foreground">INACTIVE</span>
                      ),
                  },

                  {
                    key: "actions",
                    label: "Actions",
                    render: (item) => (
                      <div className="flex gap-2">
                        <StatusToggleModal
                          id={item.id}
                          onDelete={ToggleSubjectStatus}
                          onSuccess={() => {
                            form.reset();
                            queryClient.invalidateQueries({
                              queryKey: ["subjects"],
                            });
                          }}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </div>
            {/* <!-- --------- Add subject Form -------------> */}
            <div className=" rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
                Add subject
              </h3>

              <FormProvider {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit(addBtn)}
                >
                  {/* ------- name ----------- */}

                  <FormInput
                    control={form.control}
                    label="Subject Name"
                    name="name"
                    placeholder="e.g., Bangla 1st Paper"
                  />
                  {/*----------- shortName -----------*/}

                  <FormInput
                    control={form.control}
                    label="Subject Short Name"
                    name="shortName"
                    placeholder="e.g., Bng, Eng"
                  />

                  {/*---------- code -----------*/}
                  <FormInput
                    control={form.control}
                    label="Subject Code"
                    name="code"
                    placeholder="e.g., 101, 102"
                  />
                  {/* ---------type-------- */}
                  <FormSelect
                    control={form.control}
                    name="subject_type"
                    label="Subject Type"
                    options={[
                      { label: "COMPULSORY", value: "COMPULSORY" },
                      { label: "GROUP_BASED", value: "GROUP_BASED" },
                      { label: "RELIGION", value: "RELIGION" },
                    ]}
                  />

                  {/*--------- optional checkbox --------------*/}
                  <FormCheckbox
                    control={form.control}
                    name="isOptional"
                    label="Add to Optional List"
                    disabled={subType !== "GROUP_BASED"}
                  />

                  {/*--------- religion list --------------*/}
                  <FormSelect
                    disabled={subType !== "RELIGION"}
                    control={form.control}
                    name="religion"
                    label="Choose Religion"
                    options={[
                      { label: "ISLAM", value: "ISLAM" },
                      { label: "HINDUISM", value: "HINDUISM" },
                      { label: "CHRISTIANITY", value: "CHRISTIANITY" },
                      { label: "BUDDHISM", value: "BUDDHISM" },
                    ]}
                  />

                  {/* -------submit button------------- */}
                  <Button
                    disabled={isSubmitting}
                    variant="default"
                    type="submit"
                  >
                    {isSubmitting ? (
                      <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Subject
                  </Button>
                </form>
              </FormProvider>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="subject-assign">
          <SubjectAssignTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
