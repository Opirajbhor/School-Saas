import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getOnboardingStep } from "@/src/server-actions/signup.action";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  getOnboardingStep();

  return <DashboardShell>{children}</DashboardShell>;
}
