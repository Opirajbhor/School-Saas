"use client";
import { Button } from "@/components/ui/button";
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
import {
  createSession,
  deleteSessions,
  getAcademicSession,
} from "@/src/server-actions/academicSession.action";
import {
  academicSessionType,
  academicSessionZod,
  sessionList,
} from "@/src/validation/academicSessions.zod";
import { Input } from "@base-ui/react/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Eye, Calendar, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { handleCrudAction } from "@/src/lib/crud-funtions/client-crud-action";
import DeleteModal from "@/components/modal/delete-modal";

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

  // add button
  const addBtn = async (data: academicSessionType) => {
    await handleCrudAction(createSession, data, {
      successMessage: "Session Created Successfully",
      onSuccess: (items) => {
        // Assuming 'items' is the newly created session
        setSessions((prev) => [...prev, items as sessionList]);
        form.reset();
      },
    });
  };

  // Calculate stats
  const totalStudents = 1000;
  const activeClasses = 27;
  const totalTerms = 5;

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
        {/* <!--  Add session Form --> */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            Add Session
          </h3>

          {/* add session form */}
          <form className="space-y-4" onSubmit={form.handleSubmit(addBtn)}>
            <div>
              <Label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Academic Session Name
              </Label>
              <Input
                {...form.register("year", {
                  required: "Session name is required",
                })}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., 2026"
              />
              {form.formState.errors.year && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.year.message}
                </p>
              )}
            </div>

            <Button disabled={isSubmitting} variant="default" type="submit">
              {isSubmitting ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}{" "}
              Add Session
            </Button>
          </form>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
        {/* Table Header/Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground">
            Academic Session ({sessions.length})
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
        <div className="overflow-x-auto p-5">
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
              {sessions.map((item) => (
                <TableRow
                  key={item.id}
                  className={`${
                    item.isActive
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/50"
                  } transition-colors group`}
                >
                  <TableCell className="py-3">
                    <div
                      className={`font-medium ${
                        item.isActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.year}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground py-3">
                    {`01 Jan, ${item.year}-31 Dec, ${item.year}`}
                  </TableCell>

                  <TableCell className="py-3">
                    <Badge
                      className={`${item.isActive ? "bg-green-600" : "bg-gray-400"} border`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full bg-primary/5 hover:bg-primary/10 mr-1.5 inline-block`}
                      >
                        *
                      </span>
                      {item.isActive ? "Active" : "Completed"}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-medium text-foreground py-3">
                    {"300"}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div
                      className={`flex items-center justify-end gap-1 transition-opacity`}
                    >
                      {
                        <>
                          {/* <EditSession
                            sessions={sessions}
                            setSessions={setSessions}
                          /> */}
                          <DeleteModal
                            id={item.id}
                            onDelete={deleteSessions}
                            onSuccess={() => {
                              form.reset();
                              setSessions((prev) =>
                                prev.filter((c) => c.id !== item.id),
                              );
                            }}
                          />
                        </>
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
