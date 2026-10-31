import { Card } from "@/components/ui/card";
import { Layers, LayoutGrid, School } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { getClasses } from "./_actions/classes.action";
import { ClassesTable } from "./_table/classes-table";

export default async function ClassesPage() {
  const result = await getClasses();

  // this used to render a full-page spinner, so a failed query looked like a
  // page that never finished loading
  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load classes
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const classes = result.data;
  const sections = classes.reduce(
    (total, cls) => total + (cls.sections?.length ?? 0),
    0,
  );
  const activeClasses = classes.filter((cls) => cls.status === "ACTIVE").length;
  const withoutSection = classes.filter(
    (cls) => (cls.sections?.length ?? 0) === 0,
  ).length;
  const withSection = classes.length - withoutSection;

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Classes"
        subtitle={`${metricValue(classes.length)} classes · ${metricValue(
          sections,
        )} sections`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Classes"
          value={metricValue(classes.length)}
          icon={School}
          footer={
            <p className="text-xs text-muted-foreground">
              {activeClasses} active
            </p>
          }
        />

        <Metric
          label="Sections"
          value={metricValue(sections)}
          icon={Layers}
          footer={
            <p className="text-xs text-muted-foreground">
              {classes.length > 0
                ? `${(sections / classes.length).toFixed(1)} per class`
                : "No classes yet"}
            </p>
          }
        />

        <Metric
          label="Active classes"
          value={metricValue(activeClasses)}
          icon={LayoutGrid}
          footer={
            <p className="text-xs text-muted-foreground">
              currently running
            </p>
          }
        />

        <Metric
          label="Without a section"
          value={metricValue(withoutSection)}
          icon={LayoutGrid}
          segments={
            classes.length > 0
              ? [
                  { value: withSection, className: "bg-foreground" },
                  { value: withoutSection, className: "bg-destructive/50" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              {withoutSection === 0
                ? "Every class has a section"
                : "A class needs a section before students can enrol"}
            </p>
          }
        />
      </div>

      <ClassesTable classes={classes} />
    </main>
  );
}
