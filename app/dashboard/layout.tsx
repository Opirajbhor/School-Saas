import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getOnboardingStep } from "@/src/server-actions/auth/signup.action";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const step = await getOnboardingStep();
  // a superadmin has no institute, so it must never reach the tenant dashboard.
  if (step === "SUPERADMIN") {
    redirect("/super-admin/institutes");
  }
  if (step === "UNAUTHORIZED") {
    redirect("/auth/onboarding/institute-profile");
  }
  if (step === "INSTITUTE") {
    redirect("/auth/onboarding/institute-profile");
  }
  if (step === "ADMIN") {
    redirect("/auth/onboarding/admin-profile");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
