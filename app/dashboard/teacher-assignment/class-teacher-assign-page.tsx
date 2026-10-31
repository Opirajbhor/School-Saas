"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/forms/form-select";
import DeleteModal from "@/components/modal/delete-modal";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { DataTable } from "@/components/table/tanstack/data-table";
import { DataTableFeatures } from "@/components/table/tanstack/data-table-features";
import { fetchData } from "@/src/tanstackQuery/queryReturnDataFn";
import { handleCrudAction } from "@/src/server-actions/crud-funtions/client-post-action";
import {
  InputClassTeacherType,
  sectionClassTeacherZod,
} from "@/src/validation/teacher-assignment.zod";
import {
  assignClassTeacher,
  deleteAssignTeacher,
  getassignedClassTeachers,
} from "./_actions/teacher-assignment.action";
import { getClasses } from "../classes/_actions/classes.action";
import { getTeacher } from "../teachers/_actions/teacher.action";

type ClassTeacherRow = {
  id: string;
  class?: { name?: string | null } | null;
  section?: { name?: string | null } | null;
  teacher?: { nameEnglish?: string | null } | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, ClassTeacherRow>();

const buildColumns = (onDeleted: () => void) =>
  columnHelper.columns([
    columnHelper.accessor((row) => row.class?.name ?? "", {
      id: "class",
      header: "Class",
      filterFn: "includesString",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.class?.name ?? "—"}
        </span>
      ),
    }),

    columnHelper.accessor((row) => row.section?.name ?? "", {
      id: "section",
      header: "Section",
      filterFn: "includesString",
      cell: ({ row }) => (
        <span className="rounded border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {row.original.section?.name ?? "—"}
        </span>
      ),
    }),

    columnHelper.accessor((row) => row.teacher?.nameEnglish ?? "", {
      id: "teacher",
      header: "Class teacher",
      filterFn: "includesString",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.teacher?.nameEnglish ?? "—"}
        </span>
      ),
    }),

    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DeleteModal
            id={row.original.id}
            onDelete={deleteAssignTeacher}
            onSuccess={onDeleted}
          />
        </div>
      ),
    }),
  ]);

export function ClassTeacherAssign() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // ------- tanstack queries -------------
  const { data: classInfo = [], isPending: isClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => fetchData(getClasses),
  });
  const { data: teacherInfo = [], isPending: isTeacher } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => fetchData(getTeacher),
  });
  const { data: classTeachers = [], isPending: isClassTeacherPending } =
    useQuery({
      queryKey: ["classTeacher", "assigned"],
      queryFn: async () => fetchData(getassignedClassTeachers),
    });

  // ------------- form ------------------
  const form = useForm<InputClassTeacherType>({
    resolver: zodResolver(sectionClassTeacherZod),
    defaultValues: {},
  });
  const { isSubmitting } = form.formState;

  // ------------ assignable teacher list ------------
  const availableTeachers =
    teacherInfo?.filter(
      (teacher) => !classTeachers?.some((ct) => ct.teacherId === teacher.id),
    ) ?? [];

  // ------------- available section list------------
  const availableSections =
    classInfo
      ?.map((item) => ({
        ...item,
        sections: (item?.sections ?? []).filter(
          (sec) => !classTeachers?.some((ct) => ct.sectionId === sec.id),
        ),
      }))
      .filter((item) => item.sections.length > 0) ?? [];

  const selectedClassId = useWatch({ control: form.control, name: "classId" });
  const selectedClass = availableSections.find(
    (item) => item.id === selectedClassId,
  );
  const selectedSectionId = useWatch({
    control: form.control,
    name: "sectionId",
  });

  const columns = useMemo(
    () =>
      buildColumns(() =>
        queryClient.invalidateQueries({
          queryKey: ["classTeacher", "assigned"],
        }),
      ),
    [queryClient],
  );

  const addBtn = async (data: InputClassTeacherType) => {
    const res = await handleCrudAction(assignClassTeacher, data, {
      // this used to say "Student Created Successfully" on a teacher
      // assignment
      successMessage: "Class teacher assigned",
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["classTeacher", "assigned"],
        });
        form.reset({});
      },
    });

    if (!res.success) return;
  };

  if (isClasses || isTeacher || isClassTeacherPending) {
    return <PageSkeleton rows={5} />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Assign a class teacher
          </h2>
          <p className="text-xs text-muted-foreground">
            One class teacher per section, per academic session.
          </p>
        </div>

        <FormProvider {...form}>
          <form
            className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
            onSubmit={form.handleSubmit(addBtn)}
          >
            <FormSelect
              control={form.control}
              name="classId"
              label="Class"
              options={
                (classInfo ?? [])
                  .filter(
                    (item): item is typeof item & { id: string } =>
                      item.id !== undefined && item.status === "ACTIVE",
                  )
                  .map((item) => ({ label: item.name, value: item.id })) ?? []
              }
            />

            <FormSelect
              control={form.control}
              name="sectionId"
              label="Section"
              disabled={!selectedClassId}
              options={(selectedClass?.sections ?? [])
                .filter((item) => item.id !== undefined)
                .filter((item) => item.status === "ACTIVE")
                .map((item) => ({
                  label: item.name as string,
                  value: item.id as string,
                }))}
            />

            <FormSelect
              control={form.control}
              name="teacherId"
              label="Class teacher"
              disabled={!selectedSectionId}
              options={(availableTeachers ?? [])
                .filter((item) => item.id !== undefined)
                .filter((item) => item.status === "ACTIVE")
                .map((item) => ({
                  label: item.nameEnglish as string,
                  value: item.id as string,
                }))}
            />

            <Button
              disabled={isSubmitting}
              type="submit"
              size="sm"
              className="mb-0.5"
            >
              Assign
            </Button>
          </form>
        </FormProvider>
      </Card>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Assigned class teachers
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {classTeachers.length}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={classTeachers as ClassTeacherRow[]}
          globalFilter={search}
          toolbar={() => (
            <div className="px-4 py-3">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by class, section or teacher..."
                  className="pl-9"
                />
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
