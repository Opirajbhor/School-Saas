"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Pen,
  Search,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { StatCards } from "@/components/dashboard/stat-cards";
import { AddStudentType } from "@/src/validation/student.zod";
import { toast } from "sonner";
import { getStudents } from "@/src/server-actions/student.action";
import Link from "next/link";
import { SpinnerCustom } from "@/components/Spinner";
import Title from "@/components/Title";
import { clientReadAction } from "@/src/lib/crud-funtions/client-read-action";

type RequiredFields = AddStudentType & {
  session: string;
  className: string;
  section: string;
  roll: string;
};

export default function Page() {
  const [loading, setLoading] = useState<boolean>(false);

  const [students, setStudents] = useState<RequiredFields[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil((students?.length ?? 0) / itemsPerPage);

  // get Student data
  useEffect(() => {
    async function getlist() {
      await clientReadAction(getStudents, {
        onSuccess: (data) => setStudents(data as RequiredFields[]),
        onLoading: setLoading,
      });
    }
    getlist();
  }, []);
  if (loading) {
    return <SpinnerCustom />;
  }

  return (
    <div className="w-full max-w-7xl space-y-6 my-8 mx-auto px-4 sm:px-6 lg:px-8">
      <Title title="Student Management" />
      <p className="text-muted-foreground ">
        Manage enrolled students across all classes and sections.
      </p>
      <div className=" mb-5">
        <StatCards />
      </div>

      <Card className="pb-0 gap-0">
        <CardHeader className="border-b border-border gap-0">
          {/* tools */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search user" className="pl-10" />
            </div>
            <div className="sm:ml-auto flex items-center gap-2 flex-wrap justify-center">
              <Link href={"/dashboard/students/add-new"}>
                <Button variant={"default"}>Add Student</Button>
              </Link>
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
                    Student ID
                  </th>

                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Student Name <br />
                    Father Name <br />
                    Mother Name
                  </th>

                  <th className="text-left p-4 font-medium text-sm text-nowrap text-muted-foreground uppercase tracking-wider">
                    Religion <br />
                    GENDER <br />
                    DOB
                  </th>

                  <th className="text-left p-4 font-medium text-sm text-nowrap text-muted-foreground uppercase tracking-wider">
                    Class <br />
                    Section <br />
                    Roll
                  </th>

                  <th className="text-left p-4 font-medium text-sm text-nowrap text-muted-foreground uppercase tracking-wider">
                    PHONE <br />
                    Address
                  </th>

                  <th className="text-left p-4 font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(students === null || students?.length === 0) && (
                  <p className="text-center mx-auto p-5">No Students found.</p>
                )}

                {students?.map((student, i) => (
                  <tr
                    key={student.studentId}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-4 font-medium">{student.studentId}</td>

                    <td className="p-4">
                      <p>{student.englishName}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.fatherName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.motherName}
                      </p>
                    </td>

                    <td className="p-4">
                      <p>{student.religion}</p>
                      <p>{student.gender}</p>
                      <p>{student.dateOfBirth.toLocaleDateString("en-GB")}</p>
                    </td>

                    <td className="p-4">
                      {/* <p>{student.className}</p> */}
                      {/* <p>{student.section}</p> */}
                      {/* <p>{student.roll}</p> */}
                    </td>

                    <td className="p-4">
                      <p>{student.phone}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.address}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye />
                        </Button>

                        <Button size="sm">
                          <Pen />
                        </Button>

                        <Button size="sm" variant="destructive">
                          <Trash />
                        </Button>
                      </div>
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
              {Math.min(currentPage * itemsPerPage, students?.length ?? 0)} of{" "}
              {students?.length ?? 0} entries
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
