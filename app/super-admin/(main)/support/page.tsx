import { redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { SupportList } from "@/app/dashboard/support/_components/support-list";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer("superadmin");
  if (!allowed) redirect("/unauthorize");

  return (
    <SupportList
      basePath="/super-admin/support"
      isSuper
      searchParams={await searchParams}
    />
  );
}
