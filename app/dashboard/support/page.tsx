import { redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { SupportList } from "./_components/support-list";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer(["admin", "user"]);
  if (!allowed) redirect("/unauthorize");

  return (
    <SupportList
      basePath="/dashboard/support"
      isSuper={false}
      searchParams={await searchParams}
    />
  );
}
