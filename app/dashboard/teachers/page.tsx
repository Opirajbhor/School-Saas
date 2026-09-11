"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { useSearch } from "@/src/lib/useSearch";
import { AppTable } from "@/components/table/data-table";

export default function Teacherpage() {
  const [teachers, setTeachers] = useState<Teacherlist[] | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const itemsPerPage = 6;
  const totalPages = Math.ceil((teachers?.length ?? 0) / itemsPerPage);
  const [statlist, setStatlist] = useState<TeacherStatsResponse>({
    success: false,
    error: "",
  });

  useEffect(() => {
    async function getlist() {
      try {
        await clientReadAction(getTeacher, {
          onSuccess: (data) => setTeachers(data as Teacherlist[]),
          onLoading: setLoading,
        });
        const stats = await getTeacherStats();
        if (!stats.success) {
          setTeachers(null);
          return;
        }
        setStatlist(stats);
      } catch (error) {
        console.error(error);
      }
    }

    getlist();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return <SpinnerCustom />;
  }
  return (
    <div className="w-full max-w-7xl space-y-6 my-8 mx-auto px-4 sm:px-6 lg:px-8">
      <Title title="Teacher Management" />
      <p className="text-muted-foreground ">
        Manage teaching staff, assignments, and contact details.
      </p>
      <div>
        <TeacherStats stats={statlist} />
      </div>
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
              <AddTeacher setTeachers={setTeachers} />
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
                      src={teacher.photoUrl}
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
                  <EditTeachers user={teacher} setTeachers={setTeachers} />
                  <DeleteTeacher user={teacher} setTeachers={setTeachers} />
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
