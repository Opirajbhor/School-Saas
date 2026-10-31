import { Card } from "@/components/ui/card";
import { CircleAlert, CircleCheck, Layers, School } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { getDefaultGroupClasses } from "@/app/super-admin/(main)/groups/_actions/groups.action";
import { OutputGroupClassType } from "@/src/validation/groups.zod";
import { GroupsTable } from "./_table/groups-table";

export default async function GroupsPage() {
  const result = await getDefaultGroupClasses();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load groups
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const groups = result.data as OutputGroupClassType[];
  const active = groups.filter((group) => group.status === "ACTIVE").length;
  const assigned = groups.filter(
    (group) => (group.groupClasses?.length ?? 0) > 0,
  ).length;
  const unused = groups.length - assigned;

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Groups"
        subtitle={`${metricValue(groups.length)} academic groups`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Groups"
          value={metricValue(groups.length)}
          icon={Layers}
          footer={
            <p className="text-xs text-muted-foreground">{active} active</p>
          }
        />

        <Metric
          label="Active"
          value={metricValue(active)}
          icon={CircleCheck}
          footer={
            <p className="text-xs text-muted-foreground">available to assign</p>
          }
        />

        <Metric
          label="In use"
          value={metricValue(assigned)}
          icon={School}
          segments={
            groups.length > 0
              ? [
                  { value: assigned, className: "bg-foreground" },
                  { value: unused, className: "bg-destructive/40" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              assigned to at least one class
            </p>
          }
        />

        <Metric
          label="Unused"
          value={metricValue(unused)}
          icon={CircleAlert}
          footer={
            <p className="text-xs text-muted-foreground">
              {unused === 0
                ? "Every group has classes"
                : "No class uses these groups"}
            </p>
          }
        />
      </div>

      <GroupsTable groups={groups} />
    </main>
  );
}
