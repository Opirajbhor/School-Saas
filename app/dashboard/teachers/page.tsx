"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/utils";
import AddTeacher from "@/components/dashboard/teachers/add-teacher";
import {
  getTeacher,
  getTeacherStats,
} from "@/src/server-actions/teacher.action";
import {
  Teacherlist,
  TeacherStatsResponse,
} from "@/src/validation/teacher.zod";
import DeleteTeacher from "@/components/dashboard/teachers/delete-teacher";
import Title from "@/components/Title";
import TeacherStats from "@/components/dashboard/teachers/teacher-card";
import EditTeachers from "@/components/dashboard/teachers/edit-teachers";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";
import { SpinnerCustom } from "@/components/Spinner";

import { AppTable } from "@/components/table/data-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Teacherpage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const itemsPerPage = 6;

  // ------------- query fn ---------------
  const { data: teachers = [], isPending } = useQuery<Teacherlist[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const result = await getTeacher();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as Teacherlist[];
    },
  });
  const { data: statlist, isPending: isLoading } =
    useQuery<TeacherStatsResponse>({
      queryKey: ["statlist"],
      queryFn: async () => {
        const result = await getTeacherStats();
        if (!result.success) {
          throw new Error(result.error);
        } else {
          return result as TeacherStatsResponse;
        }
      },
    });
  const totalPages = Math.ceil((teachers?.length ?? 0) / itemsPerPage);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isPending || isLoading) {
    return <SpinnerCustom />;
  }
  return (
    <div className="w-full max-w-7xl space-y-6 my-8 mx-auto px-4 sm:px-6 lg:px-8">
      <Title title="Teacher Management" />
      <p className="text-muted-foreground ">
        Manage teaching staff, assignments, and contact details.
      </p>
      <div>{statlist && <TeacherStats stats={statlist} />}</div>
      {/* Main Card */}
      <Card className="pb-0 gap-0">
        {/* Table */}

        <AppTable
          data={teachers ?? []}
          searchable
          searchPlaceholder="Search teachers..."
          searchKeys={[
            "nameEnglish",
            "nameBangla",
            "email",
            "mobile",
            "designation",
          ]}
          selectable
          selectedIds={selectedUsers}
          onSelectionChange={setSelectedUsers}
          toolbar={
            <>
              <AddTeacher />
            </>
          }
          columns={[
            {
              key: "nameEnglish",
              label: "Teacher Name",
              render: (teacher) => (
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={teacher.photoUrl ?? ""}
                      alt={teacher.nameEnglish}
                    />

                    <AvatarFallback>
                      {getInitials(teacher.nameEnglish)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="font-medium">{teacher.nameBangla}</div>
                    <div className="text-sm text-muted-foreground">
                      {teacher.nameEnglish}
                    </div>
                  </div>
                </div>
              ),
            },

            {
              key: "designation",
              label: "Designation",
            },

            {
              key: "gender",
              label: "Gender",
            },

            {
              key: "email",
              label: "Email",
            },

            {
              key: "status",
              label: "Status",
              render: (teacher) =>
                teacher.status === "ACTIVE" ? (
                  <Badge variant="outline">Active</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                ),
            },

            {
              key: "mobile",
              label: "Phone",
            },

            {
              key: "actions",
              label: "Actions",
              render: (teacher) => (
                <div className="flex gap-2">
                  <EditTeachers user={teacher} />
                  <DeleteTeacher user={teacher} />
                </div>
              ),
            },
          ]}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, teachers?.length ?? 0)} of{" "}
            {teachers?.length ?? 0} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-9 w-9",
                  currentPage === page && "bg-primary",
                  "cursor-pointer",
                )}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="h-9 w-9 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
