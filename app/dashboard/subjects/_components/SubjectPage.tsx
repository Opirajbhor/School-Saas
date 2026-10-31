import { Card } from "@/components/ui/card";
import { BookMarked, BookOpen, Layers, PencilLine } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { getSubjects } from "../_actions/subjects.action";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { SubjectsTable } from "../_table/subjects-table";

export default async function Page() {
  const result = await getSubjects();

  // a failed query used to render a full-page spinner, which looks like a page
  // that never finishes loading
  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load subjects
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const subjects = result.data as OutputSubjectType[];
  const active = subjects.filter((subject) => subject.status === "ACTIVE").length;
  const custom = subjects.filter(
    (subject) => subject.instituteId !== null,
  ).length;
  const defaults = subjects.length - custom;

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Subjects"
        subtitle={`${metricValue(subjects.length)} subjects · ${defaults} platform defaults`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Subjects"
          value={metricValue(subjects.length)}
          icon={BookOpen}
          footer={
            <p className="text-xs text-muted-foreground">{active} active</p>
          }
        />

        <Metric
          label="Active"
          value={metricValue(active)}
          icon={BookMarked}
          footer={
            <p className="text-xs text-muted-foreground">
              available to assign
            </p>
          }
        />

        <Metric
          label="Platform defaults"
          value={metricValue(defaults)}
          icon={Layers}
          segments={
            subjects.length > 0
              ? [
                  { value: defaults, className: "bg-foreground" },
                  { value: custom, className: "bg-foreground/30" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              shared with every institute
            </p>
          }
        />

        <Metric
          label="Custom"
          value={metricValue(custom)}
          icon={PencilLine}
          footer={
            <p className="text-xs text-muted-foreground">
              added by this institute
            </p>
          }
        />
      </div>

      <SubjectsTable subjects={subjects} />
    </main>
  );
}
