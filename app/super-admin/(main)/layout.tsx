import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { SuperShell } from "@/components/super-admin/super-shell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // platform-wide default data, so only a superadmin may see this section. The
  // guard lives here so every page underneath it is covered at once.
  const { allowed } = await AccessServer("superadmin");
  if (!allowed) redirect("/unauthorize");

  return <SuperShell>{children}</SuperShell>;
}
