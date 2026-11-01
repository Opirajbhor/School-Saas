import Link from "next/link";
import {
  FcDataConfiguration as Configuration,
  FcRating as Rating,
  FcSettings as Settings,
} from "react-icons/fc";
import { IoArrowForwardOutline as ArrowRight } from "react-icons/io5";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { getPlatformExamOverview } from "./_actions/exam-overview.action";
import { ExamCreateDialog } from "./_component/exam-create-dialog";
import { ExamRowActions } from "./_component/exam-row-actions";

const workflowLabel: Record<string, string> = {
  OPEN: "Mark entry open",
  FINALIZED: "Finalised",
  PUBLISHED: "Published",
};

export default async function Page() {
  const result = await getPlatformExamOverview();

  if (!result.success) {
    return (
      <main className="my-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-1 p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Could not load examinations
          </p>
          <p className="text-xs text-muted-foreground">{result.error}</p>
        </Card>
      </main>
    );
  }

  const { counts, markTypes, gradeBands, exams } = result.data;
  const topBand = gradeBands[0];

  const cards = [
    {
      href: "/super-admin/exam/mark-types",
      icon: Configuration,
      title: "Mark types",
      description: "CQ, MCQ and practical papers.",
      value: counts.markTypes,
      label: `${counts.activeMarkTypes} active`,
      chips: markTypes.slice(0, 4).map((type) => type.name),
    },
    {
      href: "/super-admin/exam/grade-ranges",
      icon: Rating,
      title: "Grade ranges",
      description: "Mark bands and their GPA points.",
      value: counts.gradeBands,
      label: topBand ? `top band ${topBand.name}` : "not configured",
      chips: gradeBands
        .slice(0, 4)
        .map((band) => `${band.name} ${band.minMark}–${band.maxMark}`),
    },
    {
      href: "/super-admin/exam/mark-config",
      icon: Settings,
      title: "Mark config",
      description: "Full and pass marks per subject.",
      value: counts.configuredSubjects,
      label: `of ${counts.totalSubjects} subjects`,
      chips: [] as string[],
    },
  ];

  return (
    <main className="my-6 w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Examinations"
        subtitle="Platform defaults every institute sits for — papers, mark types, grade bands and mark configuration."
        actions={<ExamCreateDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-2">
              <card.icon className="size-6" />
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {card.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>

            <div className="mt-auto space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums text-foreground">
                  {card.value}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {card.label}
                </span>
              </div>

              {card.chips.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {card.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">All exams</h2>
            <p className="text-xs text-muted-foreground">
              Platform papers, newest first.
            </p>
          </div>
          <span className="rounded-full border px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {exams.length} · {counts.activeExams} active
          </span>
        </div>

        {exams.length === 0 ? (
          <div className="flex flex-col items-center gap-1 p-8 text-center">
            <p className="text-sm font-medium text-foreground">No exams yet</p>
            <p className="text-xs text-muted-foreground">
              Use “New exam” above to create the first paper.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {exams.map((exam) => (
              <li
                key={exam.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {exam.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {exam.sessionYear
                      ? `Session ${exam.sessionYear}`
                      : "No session"}
                    {exam.classes.length > 0
                      ? ` · ${exam.classes.join(", ")}`
                      : " · no classes assigned"}
                  </p>
                </div>

                <span className="rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {workflowLabel[exam.markWorkflow] ?? exam.markWorkflow}
                </span>
                <StatusPill status={exam.status} />

                <ExamRowActions
                  exam={{
                    id: exam.id,
                    name: exam.name,
                    assignClasses: exam.assignClasses,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
