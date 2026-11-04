import { redirect } from "next/navigation";
import { CalendarBlank } from "@phosphor-icons/react/ssr";

import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  getExamRoutine,
  getRoutineExams,
} from "../_actions/routine.action";
import { RoutineBoard } from "./_component/routine-board";
import { PrintRoutineButton } from "./_component/print-routine-button";

// The exam routine: which paper is sat on which date, at what time, per class.
// The board is a matrix — dates down the side, classes across the top — because
// that is the shape a school actually reads it in.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const query = await searchParams;
  const picked = Array.isArray(query.exam) ? query.exam[0] : query.exam;

  const examsResult = await getRoutineExams();
  if (!examsResult.success) {
    return (
      <main className="my-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {examsResult.error}
        </Card>
      </main>
    );
  }

  const exams = examsResult.data;
  const examId = picked && exams.some((exam) => exam.id === picked)
    ? picked
    : exams[0]?.id;

  const routine = examId
    ? await getExamRoutine({ examId })
    : ({ success: false as const, error: "No exam yet", details: {} });

  return (
    <main className="my-6 w-full max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Exam routine"
        subtitle="Date, time and paper for every class — print it once and it is the school's timetable"
        actions={
          examId ? (
            <PrintRoutineButton
              examId={examId}
              classes={
                routine.success
                  ? routine.data.classes.map((klass) => ({
                      label: klass.name,
                      value: klass.id,
                    }))
                  : []
              }
            />
          ) : undefined
        }
      />

      {!examId ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <CalendarBlank className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No exam yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Create an exam and assign classes to it first — the routine hangs off
            that assignment.
          </p>
        </Card>
      ) : !routine.success ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {routine.error}
        </Card>
      ) : (
        <RoutineBoard
          exams={exams.map((exam) => ({ label: exam.name, value: exam.id }))}
          examId={examId}
          data={routine.data}
        />
      )}
    </main>
  );
}
