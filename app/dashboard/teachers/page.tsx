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
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function Teacherpage() {
  const [teachers, setTeachers] = useState<Teacherlist[] | null>();
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
        const info = await getTeacher();
        const stats = await getTeacherStats();

        if (!info.success || !stats.success) {
          setTeachers(null);
          return;
        }
        setStatlist(stats);
        setTeachers(info.data as Teacherlist[]);
      } catch (error) {
        console.error(error);
      }
    }

    getlist();
  }, []);
  const currentUsers =
    teachers?.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    ) ?? [];

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleAllUsers = () => {
    if (
      selectedUsers.length === currentUsers.length &&
      currentUsers.length > 0
    ) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map((user) => user.id));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // delete item
  return (
    <div className="w-full max-w-7xl space-y-6 my-8 mx-auto px-4 sm:px-6 lg:px-8">
      <Title title="Teacher Management" />
      <div>
        <TeacherStats stats={statlist} />
      </div>

      {/* Main Card */}
      <Card className="pb-0 gap-0">
        <CardHeader className="border-b border-border gap-0">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search user" className="pl-10" />
            </div>
            <div className="sm:ml-auto flex items-center gap-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs cursor-pointer"
              >
                <Filter />
                Filter
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  <Download data-icon="inline-start" />
                  Export
                  <ChevronDown data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer">
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* add teacher------------------- */}

              <AddTeacher setTeachers={setTeachers} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                    <Checkbox
                      checked={
                        selectedUsers.length === currentUsers.length &&
                        currentUsers.length > 0
                      }
                      onCheckedChange={toggleAllUsers}
                    />
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Teacher Name
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-nowrap text-muted-foreground uppercase tracking-wider">
                    GENDER
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-nowrap text-muted-foreground uppercase tracking-wider">
                    E-MAIL
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-nowrap text-muted-foreground uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-nowrap text-muted-foreground uppercase tracking-wider">
                    PHONE
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(teachers === null || teachers?.length === 0) && (
                  <p>No teachers found.</p>
                )}
                {/* ----------------- */}
                {teachers?.map((user, i) => (
                  <tr
                    key={i}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 flex items-center justify-center gap-1">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      {i + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 bg-muted">
                          <AvatarImage
                            src={user.photoUrl}
                            alt={user.nameEnglish}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(user.nameEnglish)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">
                            {user.nameBangla}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.nameEnglish}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {user.designation}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground text-nowrap">
                        {user.gender}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground text-nowrap">
                        {user.email}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {user.status === "ACTIVE" ? (
                        <Badge
                          variant="outline"
                          className="px-2.5 py-0.5 font-semibold bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                        >
                          Active
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground text-nowrap">
                        {user.mobile}
                      </span>
                    </td>
                    <td className="p-4">
                      <DeleteTeacher user={user} setTeachers={setTeachers} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
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
                ),
              )}
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
        </CardContent>
      </Card>
    </div>
  );
}
