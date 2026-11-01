import Link from "next/link";
import { IoArrowBackOutline as ArrowLeft } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableCard } from "@/components/table/tanstack/table-card";
import {
  subjectsAssignColumn,
  type AssignRow,
} from "../_table/subjectAssign-column";
import { getDefaultAssignSubjects } from "../_actions/subjects.action";
import { SubjectAssign } from "./subject-assign-tab";

export default async function Page() {
  const result = await getDefaultAssignSubjects();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load subject assignments
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const rows = (result.data ?? []) as AssignRow[];
  const classCount = new Set(rows.map((row) => row.className)).size;
  const subjectCount = new Set(rows.map((row) => row.subjectName)).size;

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Subject assignment"
        subtitle="Which platform subjects each class carries, and how they are graded."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/super-admin/subjects">
              <ArrowLeft />
              All subjects
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {rows.length === 0 ? (
            <Card className="flex flex-col items-center gap-1 p-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No subjects assigned yet
              </p>
              <p className="text-xs text-muted-foreground">
                Pick a class on the right and choose the subjects it offers.
              </p>
            </Card>
          ) : (
            <TableCard
              title="Assigned subjects"
              hint={`${classCount} classes · ${subjectCount} subjects`}
              searchPlaceholder="Search by class, subject or group..."
              columns={subjectsAssignColumn}
              data={rows}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <SubjectAssign />
        </div>
      </div>
    </main>
  );
}
