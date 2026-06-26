import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
