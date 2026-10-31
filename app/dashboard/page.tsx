import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AttentionQueue } from "@/components/dashboard/attention-queue";
import {
  ClassDistributionChart,
  SubjectWorkloadChart,
} from "@/components/dashboard/charts";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { ResultsTable } from "@/components/dashboard/result-table";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Welcome } from "@/components/dashboard/welcome";
import { getInstituteProfile } from "@/src/server-actions/shared/get-user-profile.action";
import {
  getClassDistribution,
  getDashboardCounts,
  getExamProgress,
  getSectionCoverage,
  getSetupSummary,
} from "./_actions/dashboard.action";
import {
  buildAttentionItems,
  overallMarkProgress,
  type ExamProgress,
} from "./_lib/attention";

export default async function page() {
  const profile = await getInstituteProfile();
  if (!profile) {
    return <PageSkeleton />;
  }
  const { institute, teacher } = profile;

  // every query is institute-scoped inside its action, so the page never sees
  // another tenant's rows
  const [counts, distribution, setup, coverage, progress] = await Promise.all([
    getDashboardCounts(),
    getClassDistribution(),
    getSetupSummary(),
    getSectionCoverage(),
    // paper-level progress, five grouped queries for every exam. The section
    // level monitoring summary is far more expensive and belongs on the exam
    // page, not here.
    getExamProgress(),
  ]);

  const classRows = distribution.success ? distribution.data : [];

  const exams: ExamProgress[] = progress.success
    ? progress.data.map((row): ExamProgress => {
        const completion =
          row.papers === 0
            ? 0
            : Math.round((row.papersEntered / row.papers) * 100);

        return {
          examId: row.id,
          examName: row.name,
          sessionName: row.sessionYear,
          assignedClasses: row.assignedClasses,
          units: row.papers,
          completedUnits: row.papersEntered,
          completion,
          status:
            row.papers === 0 || row.papersEntered === 0
              ? "NOT_STARTED"
              : row.papersEntered >= row.papers
                ? "COMPLETED"
                : "IN_PROGRESS",
          pendingRequests: row.pendingRequests,
          workflow: row.workflow,
        };
      })
    : [];

  const marks = exams.length > 0 ? overallMarkProgress(exams) : null;

  const attention = buildAttentionItems({
    setup: setup.success ? setup.data : undefined,
    exams,
    coverage: coverage.success ? coverage.data : undefined,
  });

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <Welcome
        institute={institute}
        teacher={teacher}
        sessionYear={setup.success ? setup.data.sessionYear : null}
      />

      <AttentionQueue items={attention} />

      <StatCards
        counts={counts.success ? counts.data : undefined}
        coverage={coverage.success ? coverage.data : undefined}
        marks={marks}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ResultsTable rows={exams} />
        </div>
        <div className="lg:col-span-4">
          <ActivityFeed />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ClassDistributionChart data={classRows} />
        <SubjectWorkloadChart data={classRows} />
      </div>
    </main>
  );
}
