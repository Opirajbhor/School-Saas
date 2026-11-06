import { redirect } from "next/navigation";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { TicketView } from "../_components/ticket-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { allowed } = await AccessServer(["admin", "user"]);
  if (!allowed) redirect("/unauthorize");

  const { id } = await params;
  return <TicketView ticketId={id} basePath="/dashboard/support" isSuper={false} />;
}
