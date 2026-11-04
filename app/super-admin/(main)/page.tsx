import Link from "next/link";
import { BookmarkSimple as Tags, GenderMale as UserRound, UsersThree as Users, Buildings as Building2, FileText, Globe as MapPin, GraduationCap, TreeStructure as Layers, CalendarCheck as CalendarRange } from "@phosphor-icons/react/ssr";


import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Metric, metricValue } from "@/components/dashboard/metric";
import { StatusPill } from "@/components/dashboard/status-pill";
import { getPlatformOverview } from "./_actions/platform.action";
import { formatDate } from "@/src/lib/date";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

export default async function SuperAdminPage() {
  const result = await getPlatformOverview();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load platform stats
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const { counts, institutes, sessions } = result.data;

  const inactiveInstitutes = counts.institutes - counts.activeInstitutes;
  const withStudents = institutes.filter((row) => row.students > 0).length;
  const withoutStudents = institutes.length - withStudents;
  const activeSession = sessions.find((row) => row.status === "ACTIVE");

  const byDivision = Object.entries(
    institutes.reduce<Record<string, number>>((acc, row) => {
      const key = row.division || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([division, value]) => ({ division, value }))
    .sort((a, b) => b.value - a.value);

  const maxDivision = Math.max(...byDivision.map((row) => row.value), 1);

  const defaults = [
    { label: "Classes", value: counts.defaultClasses, icon: GraduationCap },
    { label: "Subjects", value: counts.defaultSubjects, icon: FileText },
    { label: "Groups", value: counts.defaultGroups, icon: Layers },
    { label: "Mark types", value: counts.defaultMarkTypes, icon: Tags },
    { label: "Grade bands", value: counts.defaultGradeBands, icon: FileText },
  ];

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Platform overview"
        subtitle="Every institute on Educare, and how much of the platform is actually in use."
        actions={
          <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
            {activeSession
              ? `Session ${activeSession.year} active`
              : "No active session"}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Institutes"
          value={metricValue(counts.institutes)}
          icon={Building2}
          segments={
            counts.institutes > 0
              ? [
                  { value: counts.activeInstitutes, className: "bg-foreground" },
                  { value: inactiveInstitutes, className: "bg-foreground/25" },
                ]
              : undefined
          }
          footer={
            <p className="text-xs text-muted-foreground">
              {counts.activeInstitutes} active
            </p>
          }
        />

        <Metric
          label="Students"
          value={metricValue(counts.students)}
          icon={Users}
          footer={
            <p className="text-xs text-muted-foreground">
              enrolled across all institutes
            </p>
          }
        />

        <Metric
          label="Teachers"
          value={metricValue(counts.teachers)}
          icon={UserRound}
          footer={
            <p className="text-xs text-muted-foreground">
              on institute staff lists
            </p>
          }
        />

        <Metric
          label="Exams"
          value={metricValue(counts.exams)}
          icon={FileText}
          footer={
            <p className="text-xs text-muted-foreground">
              {counts.sections} sections created
            </p>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 overflow-hidden p-0 lg:col-span-2">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Institutes by division
            </h2>
            <p className="text-xs text-muted-foreground">
              Where the schools on the platform actually are.
            </p>
          </div>

          <div className="space-y-3 p-4">
            {byDivision.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No institutes have signed up yet.
              </p>
            )}

            {byDivision.map((row) => (
              <div key={row.division} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
                  {row.division}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${(row.value / maxDivision) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden p-0">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Adoption</h2>
            <p className="text-xs text-muted-foreground">
              Institutes with at least one student enrolled.
            </p>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">
                {metricValue(withStudents)}
              </span>
              <span className="text-xs text-muted-foreground">
                of {metricValue(institutes.length)} institutes
              </span>
            </div>

            {institutes.length > 0 && (
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-foreground"
                  style={{
                    width: `${(withStudents / institutes.length) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-destructive/40"
                  style={{
                    width: `${(withoutStudents / institutes.length) * 100}%`,
                  }}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {withoutStudents === 0
                ? "Every institute has students enrolled."
                : `${withoutStudents} institute(s) still have no students.`}
            </p>

            <Link
              href="/super-admin/institutes"
              className="inline-block text-xs font-medium text-foreground hover:underline"
            >
              Manage institutes
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Recent institutes
              </h2>
              <p className="text-xs text-muted-foreground">
                Newest sign-ups first.
              </p>
            </div>
            <Link
              href="/super-admin/institutes"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          <div className="divide-y">
            {institutes.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No institutes yet.
              </p>
            )}

            {institutes.slice(0, 5).map((institute) => (
              <div
                key={institute.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                  {initialsOf(institute.nameEnglish)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {institute.nameEnglish}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">EIIN {institute.eiin}</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="size-3" />
                      {institute.district}, {institute.division}
                    </span>
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {institute.students} students
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(institute.createdAt)}
                  </p>
                </div>

                <StatusPill status={institute.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden p-0">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Platform defaults
            </h2>
            <p className="text-xs text-muted-foreground">
              Rows with no institute — every school inherits them.
            </p>
          </div>

          <div className="divide-y">
            {defaults.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="size-4" />
                  {item.label}
                </span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {metricValue(item.value)}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarRange className="size-4" />
                Sessions
              </span>
              <span className="text-sm font-medium tabular-nums text-foreground">
                {metricValue(sessions.length)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
