"use client";
import { SpinnerCustom } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-post-action";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import {
  addSubjects,
  getSubjects,
  ToggleSubjectStatus,
} from "@/src/server-actions/subjects.action";
import {
  inputSubjectType,
  inputSubjectZod,
  outputSubjectType,
} from "@/src/validation/subjects.zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { MdOutlineRadioButtonUnchecked } from "react-icons/md";
import { IoMdCheckmarkCircle } from "react-icons/io";
import { SubjectAssignTab } from "./subject-assign-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { AppTable } from "@/components/table/data-table";
import StatusToggleModal from "@/components/modal/status-modal";

export default function Page() {
  const [loading, setLoading] = useState<boolean>(true);
  const [subjects, setSubjects] = useState<outputSubjectType[] | undefined>(
    undefined,
  );
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

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
  const methods = useForm();

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
                    render: (teacher) =>
                      teacher.status === "ACTIVE" ? (
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
                            setSubjects((prev) =>
                              prev?.map((c) =>
                                c?.id === item.id
                                  ? {
                                      ...c,
                                      status:
                                        c.status === "ACTIVE"
                                          ? "INACTIVE"
                                          : "ACTIVE",
                                    }
                                  : c,
                              ),
                            );
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

              <FormProvider {...methods}>
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

                  {/*---------- toggle -------------*/}

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

                  {/*--------- religion list --------------*/}

                  <FormSelect
                    control={form.control}
                    name="religion"
                    label="Select Religion"
                    disabled={!isReligion}
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
