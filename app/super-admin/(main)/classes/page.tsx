import { FcDepartment as School } from "react-icons/fc";
import { IoCheckmarkCircleOutline as CircleCheck, IoRemoveCircleOutline as CircleMinus } from "react-icons/io5";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { TableCard } from "@/components/table/tanstack/table-card";
import { classesType } from "@/src/validation/classes.zod";
import { ClassesColumn } from "./_table/column";
import CreateClasses from "./CreateClasses";
import { getDefaultClasses } from "./_actions/classes.action";

export default async function Page() {
  const result = await getDefaultClasses();

  // a failed read used to reach `classes.length` and crash the page
  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load classes
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  // platform defaults only — sections, students and anything else an institute
  // creates belong to that institute's own records, not to this page
  const classes = (result.data ?? []) as classesType[];
  const active = classes.filter((row) => row.status === "ACTIVE").length;
  const inactive = classes.length - active;

  return (
    <main className="my-6 w-full max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Classes"
        subtitle="The class list every institute starts from. Institutes add their own sections on top of it."
        actions={<CreateClasses />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Metric
          label="Classes"
          value={metricValue(classes.length)}
          icon={School}
          segments={
            classes.length > 0
              ? [
                  { value: active, className: "bg-foreground" },
                  { value: inactive, className: "bg-foreground/25" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">platform defaults</p>
          }
        />

        <Metric
          label="Active"
          value={metricValue(active)}
          icon={CircleCheck}
          footer={
            <p className="text-xs text-muted-foreground">
              offered to every institute
            </p>
          }
        />

        <Metric
          label="Inactive"
          value={metricValue(inactive)}
          icon={CircleMinus}
          footer={
            <p className="text-xs text-muted-foreground">
              hidden from new setups
            </p>
          }
        />
      </div>

      {classes.length === 0 ? (
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">No classes yet</p>
          <p className="text-xs text-muted-foreground">
            Institutes cannot enrol students until classes exist.
          </p>
        </Card>
      ) : (
        <TableCard
          title="Default classes"
          hint="Shown to every institute"
          searchPlaceholder="Search classes..."
          columns={ClassesColumn}
          data={classes}
        />
      )}
    </main>
  );
}
