"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { handleCrudAction } from "@/src/lib/crud-funtions/handle-crud-action";
import {
  acadecmicSession,
  getAcademicSession,
} from "@/src/server-actions/academicSession.action";
import {
  academicSessionType,
  academicSessionZod,
  sessionList,
} from "@/src/validation/academicSessions.zod";
import { Input } from "@base-ui/react/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Filter,
  Edit,
  Lock,
  Trash2,
  Eye,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SessionPage() {
  const [sessions, setSessions] = useState<sessionList[]>([]);
  const [sortBy, setSortBy] = useState("Most Recent");
  const activeSession = sessions.find((item) => item.isActive === true);

  // get academic sessions info
  useEffect(() => {
    async function getlist() {
      try {
        const info = await getAcademicSession();
        if (info.success === false) {
          setSessions([]);
          return;
        }
        setSessions(info.data as sessionList[]);
      } catch (error) {
        console.error(error);
      }
    }
    getlist();
  }, []);

  // RHF
  const form = useForm<academicSessionType>({
    resolver: zodResolver(academicSessionZod),
    defaultValues: {
      instituteId: "",
      userId: "",
      year: "",
      isActive: true,
    },
  });
  const { isSubmitting } = form.formState;

  // add class button
  const addBtn = async (data: academicSessionType) => {
    await handleCrudAction(acadecmicSession, data, {
      successMessage: "Session Created Successfully",
      onSuccess: (item) => {
        setSessions((prev) => [...(prev || []), item]);
        form.reset();
      },
    });
  };

  // Calculate stats
  const totalStudents = 1000;
  const activeClasses = 27;
  const totalTerms = 5;

  // Prepare session history data
  const sessionHistory = sessions.slice(0, 4).map((s, index) => ({
    id: s.id || index,
    name: `${s.year} Academic Year`,
    subtitle: s.isActive
      ? "Current Year"
      : index === 0
        ? "Current Year"
        : "Archived",
    duration: `Jan 1, ${s.year} - Dec 31, ${s.year}`,
    status: s.isActive ? "Active" : "Completed",
    enrolled: "--",
    isActive: s.isActive,
    isCurrent: s.isActive && index === 0,
  }));

  // If no real data, use mock data
  const displayHistory =
    sessionHistory.length > 0
      ? sessionHistory
      : [
          {
            id: 1,
            name: "2024-2025 Academic Year",
            subtitle: "Draft Phase",
            duration: "Jan 1, 2024 - Dec 31, 2024",
            status: "Upcoming",
            enrolled: "--",
            isActive: false,
            isCurrent: false,
          },
          {
            id: 2,
            name: "2023-2024 Academic Year",
            subtitle: "Current Year",
            duration: "Jan 1, 2023 - Dec 31, 2023",
            status: "Active",
            enrolled: totalStudents > 0 ? totalStudents.toString() : "1,245",
            isActive: true,
            isCurrent: true,
          },
          {
            id: 3,
            name: "2022-2023 Academic Year",
            subtitle: "Archived",
            duration: "Jan 1, 2022 - Dec 31, 2022",
            status: "Completed",
            enrolled: "1,180",
            isActive: false,
            isCurrent: false,
          },
          {
            id: 4,
            name: "2021-2022 Academic Year",
            subtitle: "Archived",
            duration: "Jan 1, 2021 - Dec 31, 2021",
            status: "Completed",
            enrolled: "1,105",
            isActive: false,
            isCurrent: false,
          },
        ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700 border-green-200";
      case "Upcoming":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Completed":
        return "bg-gray-100 text-foreground border-gray-200";
      default:
        return "bg-gray-100 text-foreground border-gray-200";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Upcoming":
        return "bg-yellow-500";
      case "Completed":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="max-w-7xl lg:w-full mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Academic Sessions
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage school years, terms, and active sessions.
          </p>
        </div>
        {/* add session form */}
        <div className="flex items-center gap-3">
          <form
            onSubmit={form.handleSubmit(addBtn)}
            className="flex items-center gap-3"
          >
            <Input
              className="w-40 h-9 p-2 border-2 rounded-md"
              type="text"
              placeholder="Year (e.g. 2024)"
              {...form.register("year")}
              required
            />
            <Button
              disabled={isSubmitting}
              type="submit"
              className="gap-2"
              size="default"
            >
              {isSubmitting ? <Spinner /> : <Plus className="h-4 w-4" />}
              New Session
            </Button>
          </form>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Active Session Highlight Card */}
        <div className="lg:col-span-2 rounded-xl border bg-card text-card-foreground p-6 relative overflow-hidden shadow-sm">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {activeSession?.year
                      ? `${activeSession.year} Academic Year`
                      : "No Active Session"}
                  </h3>
                  {activeSession && (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 inline-block"></span>
                      Active Now
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {activeSession?.year
                    ? `Jan 1, ${activeSession.year} - Dec 31, ${activeSession.year}`
                    : "No active session"}
                </p>
              </div>
              {activeSession && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-accent"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalStudents || 245}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Active Classes
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activeClasses || 42}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Terms
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalTerms || 3}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border flex flex-col justify-center items-center text-center cursor-pointer hover:bg-accent transition-colors group">
                <BarChart3 className="h-6 w-6 text-primary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-primary">
                  View Analytics
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Upcoming Context Card */}
        <div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Transition
            </h4>
            <div className="p-4 bg-muted/50 rounded-lg border border-border mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Next Session Draft
              </p>
              <p className="text-base font-medium text-foreground mb-2">
                {sessions.length > 0
                  ? `${Math.max(...sessions.map((s) => parseInt(s.year))) + 1}-${Math.max(...sessions.map((s) => parseInt(s.year))) + 2} Academic Year`
                  : "2024-2025 Academic Year"}
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: "45%" }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                Setup 45% Complete
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Continue Setup
          </Button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
        {/* Table Header/Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground">
            Session History
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort by:</span>
            <Select value={sortBy}>
              <SelectTrigger className="w-35 h-8 text-xs border-none bg-transparent font-medium focus:ring-0">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Most Recent">Most Recent</SelectItem>
                <SelectItem value="Oldest">Oldest</SelectItem>
                <SelectItem value="A-Z">A-Z</SelectItem>
                <SelectItem value="Status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/4">
                  Session Name
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/4">
                  Duration
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/6">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider w-1/6">
                  Enrolled
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-wider text-right w-1/6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayHistory.map((item) => (
                <TableRow
                  key={item.id}
                  className={`${
                    item.isCurrent
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/50"
                  } transition-colors group`}
                >
                  <TableCell className="py-3">
                    <div
                      className={`font-medium ${
                        item.isCurrent ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.subtitle}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground py-3">
                    {item.duration}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={`${getStatusStyles(item.status)} border`}>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(item.status)} mr-1.5 inline-block`}
                      ></span>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground py-3">
                    {item.enrolled}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        !item.isCurrent
                          ? "opacity-0 group-hover:opacity-100"
                          : ""
                      } transition-opacity`}
                    >
                      {item.isCurrent ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        </>
                      ) : item.status === "Upcoming" ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/30">
          <span>
            Showing 1 to {Math.min(4, displayHistory.length)} of{" "}
            {Math.max(12, displayHistory.length)} sessions
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <span className="text-sm">←</span>
            </Button>
            <Button variant="default" size="sm" className="h-8 w-8">
              1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 hover:bg-accent"
            >
              2
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 hover:bg-accent"
            >
              3
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent"
            >
              <span className="text-sm">→</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
