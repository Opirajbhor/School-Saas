import Link from "next/link";
import { Books as BookOpen, Link as Link2, CheckCircle as CircleCheck, MinusCircle as CircleMinus } from "@phosphor-icons/react/ssr";


import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { TableCard } from "@/components/table/tanstack/table-card";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { subjectsColumn } from "./_table/column";
import CreateSubject from "./createSubject";
import CombineSubjects from "./combineSubjects";
import { getDefaultSubjects } from "./_actions/subjects.action";

export default async function Page() {
  const result = await getDefaultSubjects();

  // this page used to read `result.data` unconditionally, so a failed or empty
  // read threw on `subjects.length`
  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load subjects
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const subjects = (result.data ?? []) as OutputSubjectType[];
  const active = subjects.filter((row) => row.status === "ACTIVE").length;
  const inactive = subjects.length - active;
  const combined = subjects.filter((row) => Boolean(row.combineLabel)).length;

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Subjects"
        subtitle="Platform-wide subject list, including combined papers such as Bangla 1st and 2nd."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/super-admin/subjects/assignment">
                <Link2 />
                Subject assignment
              </Link>
            </Button>
            <CombineSubjects subjects={subjects} />
            <CreateSubject />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Subjects"
          value={metricValue(subjects.length)}
          icon={BookOpen}
          segments={
            subjects.length > 0
              ? [
                  { value: active, className: "bg-foreground" },
                  { value: inactive, className: "bg-foreground/25" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">{active} active</p>
          }
        />

        <Metric
          label="Active"
          value={metricValue(active)}
          icon={CircleCheck}
          footer={
            <p className="text-xs text-muted-foreground">
              assignable to a class
            </p>
          }
        />

        <Metric
          label="Inactive"
          value={metricValue(inactive)}
          icon={CircleMinus}
          footer={
            <p className="text-xs text-muted-foreground">
              kept for past results
            </p>
          }
        />

        <Metric
          label="Combined"
          value={metricValue(combined)}
          icon={Link2}
          footer={
            <p className="text-xs text-muted-foreground">
              1st/2nd papers graded together
            </p>
          }
        />
      </div>

      {subjects.length === 0 ? (
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">No subjects yet</p>
          <p className="text-xs text-muted-foreground">
            Create subjects before assigning them to classes.
          </p>
        </Card>
      ) : (
        <TableCard
          title="All subjects"
          hint="Search by name, code or short name"
          searchPlaceholder="Search subjects..."
          columns={subjectsColumn}
          data={subjects}
        />
      )}
    </main>
  );
}
