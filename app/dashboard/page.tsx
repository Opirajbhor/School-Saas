import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  ResultPerformanceChart,
  StudentGrowthChart,
} from "@/components/dashboard/charts";
import { ResultsTable } from "@/components/dashboard/result-table";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Welcome } from "@/components/dashboard/welcome";
import { SpinnerCustom } from "@/components/Spinner";
import { getInstituteProfile } from "@/src/server-actions/shared/get-user-profile.action";

export default async function page() {
  const profile = await getInstituteProfile();
  if (!profile) {
    return <SpinnerCustom />;
  }
  const { institute, teacher } = profile;

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <Welcome institute={institute} teacher={teacher} />
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
  );
}
