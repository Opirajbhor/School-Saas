import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getOnboardingStep } from "@/src/server-actions/auth/signup.action";
import { getInstituteBranding } from "./profile/_actions/get-institute-profile";
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

  // the rail shows the school's own name and logo once they are set
  const brand = await getInstituteBranding();

  return <DashboardShell brand={brand}>{children}</DashboardShell>;
}
