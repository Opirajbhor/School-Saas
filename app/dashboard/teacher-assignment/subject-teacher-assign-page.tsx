"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/forms/form-select";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { DataTable } from "@/components/table/tanstack/data-table";
import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { fetchData } from "@/src/tanstackQuery/queryReturnDataFn";
import { ClassWithSectionType } from "@/src/validation/classes.zod";
import {
  classSubjectGroupType,
  classSubjectGroupZod,
} from "@/src/validation/teacher-assignment.zod";
import { Teacherlist } from "@/src/validation/teacher.zod";
import {
  getActiveClassesSection,
  getSingleClassSubjects,
} from "./_actions/teacher-assignment.action";
import AssingTeacherModal from "./sub-teacher-assign-compo";

type SubjectRow = {
  subject: { id: string; name: string; shortName: string };
  subjectType: string;
  teacherName?: string | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, SubjectRow>();

/** "COMPULSORY" -> "Compulsory" — the enum value is an internal name */
const readableType = (value: string) => {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const buildColumns = (
  classData: ClassWithSectionType | undefined,
  teachers: Teacherlist[],
) =>
  columnHelper.columns([
    columnHelper.accessor((row) => row.subject?.name ?? "", {
      id: "subject",
      header: "Subject",
      filterFn: "includesString",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.original.subject.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.subject.shortName}
          </p>
        </div>
      ),
    }),

    columnHelper.accessor((row) => readableType(row.subjectType ?? ""), {
      id: "subjectType",
      header: "Type",
      filterFn: "includesString",
      cell: ({ row }) => (
        <span className="rounded border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {readableType(row.original.subjectType ?? "")}
        </span>
      ),
    }),

    columnHelper.accessor((row) => row.teacherName ?? "", {
      id: "teacher",
      header: "Assigned teacher",
      filterFn: "includesString",
      cell: ({ row }) =>
        row.original.teacherName ? (
          <span className="text-sm text-foreground">
            {row.original.teacherName}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not assigned</span>
        ),
    }),

    columnHelper.display({
      id: "actions",
      header: "",
      // the modal needs the class to scope the teacher list, so it only
      // renders once a search has produced one
      cell: ({ row }) =>
        classData ? (
          <div className="flex justify-end">
            <AssingTeacherModal
              classData={classData}
              teacherData={teachers}
              subjectId={row.original.subject.id}
            />
          </div>
        ) : null,
    }),
  ]);

const SubjectTeacherAssign = () => {
  const [searchParams, setSearchParams] =
    useState<classSubjectGroupType | null>(null);
  const [search, setSearch] = useState("");

  const { data: classInfo = [], isPending } = useQuery({
    queryKey: ["ClassSection", "active"],
    queryFn: async () => fetchData(getActiveClassesSection),
  });

  const form = useForm<classSubjectGroupType>({
    resolver: zodResolver(classSubjectGroupZod),
    defaultValues: { classId: "", sectionId: "" },
  });

  const selectedClassId = useWatch({ control: form.control, name: "classId" });
  const sections =
    classInfo?.find((item) => item.id === selectedClassId)?.sections ?? [];

  // reset the section when the class changes
  useEffect(() => {
    form.setValue("sectionId", "");
  }, [selectedClassId, form]);

  // the class and section have to be part of the key: without them every
  // search reused the first result that was ever fetched
  const { data: sectionSubData, isFetching: isSearching } = useQuery({
    queryKey: [
      "single-class-subjects",
      searchParams?.classId ?? "",
      searchParams?.sectionId ?? "",
    ],
    queryFn: () => fetchData(() => getSingleClassSubjects(searchParams!)),
    enabled: !!searchParams,
  });

  const searchBtn = (data: classSubjectGroupType) => {
    setSearchParams(data);
  };

  const classData = (sectionSubData?.class as ClassWithSectionType) ?? undefined;
  const rows = (sectionSubData?.tableData ?? []) as SubjectRow[];
  const sectionName = classData?.sections?.[0]?.name;

  // derive inside the memo: `teachers` is a fresh [] whenever the query has no
  // data, which would otherwise rebuild the columns on every render
  const columns = useMemo(() => {
    const teachers = (sectionSubData?.teachers as Teacherlist[]) ?? [];
    return buildColumns(classData, teachers);
  }, [sectionSubData, classData]);

  if (isPending) {
    return <PageSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Find a class
          </h2>
          <p className="text-xs text-muted-foreground">
            Pick a class and section to see its subjects.
          </p>
        </div>

        <FormProvider {...form}>
          <form
            className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
            onSubmit={form.handleSubmit(searchBtn)}
          >
            <FormSelect
              control={form.control}
              name="classId"
              label="Class"
              options={
                classInfo?.map((item) => ({
                  value: item.id,
                  label: item.name,
                })) ?? []
              }
            />

            <FormSelect
              control={form.control}
              name="sectionId"
              label="Section"
              disabled={!selectedClassId}
              options={
                (sections ?? [])
                  .filter((item) => item.id !== undefined)
                  .filter((item) => item.status === "ACTIVE")
                  .map((item) => ({
                    value: item.id as string,
                    label: item.name as string,
                  })) ?? []
              }
            />

            <Button
              disabled={isSearching}
              type="submit"
              size="sm"
              className="mb-0.5"
            >
              {isSearching ? "Searching..." : "Search subjects"}
            </Button>
          </form>
        </FormProvider>
      </Card>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Subjects</h2>
          {classData ? (
            <span className="text-xs text-muted-foreground">
              {classData.name}
              {sectionName ? ` · Section ${sectionName}` : ""}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              No class selected yet
            </span>
          )}
        </div>

        {sectionSubData ? (
          <DataTable
            columns={columns}
            data={rows}
            globalFilter={search}
            toolbar={() => (
              <div className="px-4 py-3">
                <div className="relative max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search subjects..."
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          />
        ) : (
          // the table used to render empty here, which reads as "this class has
          // no subjects" instead of "you have not searched yet"
          <div className="flex h-32 flex-col items-center justify-center gap-1 border-t px-4 text-center">
            <p className="text-sm font-medium text-foreground">
              Nothing to show yet
            </p>
            <p className="text-xs text-muted-foreground">
              Choose a class and section above, then search.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SubjectTeacherAssign;
