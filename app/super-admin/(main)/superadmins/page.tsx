import { FcKey as Key } from "react-icons/fc";
import { IoAddCircleOutline as Added } from "react-icons/io5";
import { IoTimeOutline as Oldest } from "react-icons/io5";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { TableCard } from "@/components/table/tanstack/table-card";
import { SuperAdminColumn } from "./_table/column";
import { SuperAdminType } from "@/src/validation/superadmin.zod";
import {
  NewSuperAdminDialog,
  PromoteSuperAdminDialog,
} from "./superadmin-dialogs";
import { getSuperAdmins } from "./_actions/superadmin.action";

export default async function Page() {
  const result = await getSuperAdmins();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load superadmins
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const rows = (result.data ?? []) as SuperAdminType[];

  const now = new Date();
  const addedThisMonth = rows.filter((row) => {
    const created = new Date(row.createdAt);
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  const oldest = rows.reduce<Date | null>((earliest, row) => {
    const created = new Date(row.createdAt);
    return !earliest || created < earliest ? created : earliest;
  }, null);

  return (
    <main className="my-6 w-full max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Super admins"
        subtitle="People with platform-wide access — every institute, the default academics and the exam settings."
        actions={
          <div className="flex items-center gap-2">
            <PromoteSuperAdminDialog />
            <NewSuperAdminDialog />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Super admins"
          value={metricValue(rows.length)}
          icon={Key}
          footer={
            <p className="text-xs text-muted-foreground">platform-wide access</p>
          }
        />
        <Metric
          label="Added this month"
          value={metricValue(addedThisMonth)}
          icon={Added}
          footer={
            <p className="text-xs text-muted-foreground">
              {now.toLocaleDateString("en-GB", { month: "long" })}
            </p>
          }
        />
        <Metric
          label="First one added"
          value={
            oldest
              ? oldest.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          icon={Oldest}
          footer={
            <p className="text-xs text-muted-foreground">earliest account</p>
          }
        />
      </div>

      <TableCard
        title="All super admin accounts"
        hint="Demoting an account revokes platform access"
        searchPlaceholder="Search by name or email..."
        columns={SuperAdminColumn}
        data={rows}
      />
    </main>
  );
}
