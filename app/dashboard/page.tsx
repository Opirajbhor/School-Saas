"use client";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  ResultPerformanceChart,
  StudentGrowthChart,
} from "@/components/dashboard/charts";
import { ResultsTable } from "@/components/dashboard/result-table";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Topbar } from "@/components/dashboard/topbar";
import { Welcome } from "@/components/dashboard/welcome";
import { authClient } from "@/src/better-auth/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const [collapsed, setCollapsed] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setCollapsed((c) => !c)} />

        <main className="flex-1 space-y-6 p-4 md:p-6">
          <Welcome />
          <StatCards />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <StudentGrowthChart />
            <ResultPerformanceChart />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ResultsTable />
            </div>
            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
