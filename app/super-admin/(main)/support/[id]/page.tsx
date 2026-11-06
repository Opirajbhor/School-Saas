import { redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { TicketView } from "@/app/dashboard/support/_components/ticket-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { allowed } = await AccessServer("superadmin");
  if (!allowed) redirect("/unauthorize");

  const { id } = await params;
  return <TicketView ticketId={id} basePath="/super-admin/support" isSuper />;
}
