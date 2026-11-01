import { FcDepartment as Building2, FcGlobe as MapPin } from "react-icons/fc";
import { IoCheckmarkCircleOutline as CircleCheck, IoRemoveCircleOutline as CircleMinus } from "react-icons/io5";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { db } from "@/src/drizzle-DB";
import { InstituteRow } from "./_table/column";
import { InstitutesTable } from "./_table/institutes-table";

export default async function Page() {
  const instituteRows = await db.query.instituteProfile.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  const institutes = instituteRows as InstituteRow[];

  const active = institutes.filter((row) => row.status === "ACTIVE").length;
  const inactive = institutes.length - active;
  const divisions = new Set(
    institutes.map((row) => row.division).filter(Boolean),
  ).size;

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Institutes"
        subtitle="Every school on the platform. Deactivating one keeps its records but blocks access."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Institutes"
          value={metricValue(institutes.length)}
          icon={Building2}
          segments={
            institutes.length > 0
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
              can sign in and enter marks
            </p>
          }
        />

        <Metric
          label="Inactive"
          value={metricValue(inactive)}
          icon={CircleMinus}
          footer={
            <p className="text-xs text-muted-foreground">
              {inactive === 0 ? "none suspended" : "access blocked"}
            </p>
          }
        />

        <Metric
          label="Divisions"
          value={metricValue(divisions)}
          icon={MapPin}
          footer={
            <p className="text-xs text-muted-foreground">
              covered by these institutes
            </p>
          }
        />
      </div>

      {institutes.length === 0 ? (
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No institutes yet
          </p>
          <p className="text-xs text-muted-foreground">
            A school appears here once it finishes onboarding.
          </p>
        </Card>
      ) : (
        <InstitutesTable institutes={institutes} />
      )}
    </main>
  );
}
