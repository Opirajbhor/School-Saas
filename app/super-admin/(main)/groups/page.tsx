import { FcDepartment as School, FcOrgUnit as Layers } from "react-icons/fc";
import { IoCheckmarkCircleOutline as CircleCheck } from "react-icons/io5";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { TableCard } from "@/components/table/tanstack/table-card";
import { OutputGroupClassType } from "@/src/validation/groups.zod";
import { GroupsColumn } from "./_table/column";
import CreateGroups from "./CreateGroups";
import { getDefaultGroupClasses } from "./_actions/groups.action";

export default async function Page() {
  const result = await getDefaultGroupClasses();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load groups
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const groups = (result.data ?? []) as OutputGroupClassType[];
  const active = groups.filter((row) => row.status === "ACTIVE").length;
  const assigned = groups.filter(
    (row) => (row.groupClasses?.length ?? 0) > 0,
  ).length;
  const unused = groups.length - assigned;

  return (
    <main className="my-6 w-full max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Groups"
        subtitle="Academic groups (Science, Humanities, Business Studies) and the classes that offer them."
        actions={<CreateGroups />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Metric
          label="Groups"
          value={metricValue(groups.length)}
          icon={Layers}
          footer={
            <p className="text-xs text-muted-foreground">{active} active</p>
          }
        />

        <Metric
          label="Assigned"
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
              groups offered by at least one class
            </p>
          }
        />

        <Metric
          label="Unused"
          value={metricValue(unused)}
          icon={CircleCheck}
          footer={
            <p className="text-xs text-muted-foreground">
              {unused === 0
                ? "every group is in use"
                : "no class offers these yet"}
            </p>
          }
        />
      </div>

      {groups.length === 0 ? (
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">No groups yet</p>
          <p className="text-xs text-muted-foreground">
            Groups only matter from Class 9 onward.
          </p>
        </Card>
      ) : (
        <TableCard
          title="All groups"
          hint="Assign a group to the classes that offer it"
          searchPlaceholder="Search groups or classes..."
          columns={GroupsColumn}
          data={groups}
        />
      )}
    </main>
  );
}
