import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/src/drizzle-DB";
import { academicSessionType } from "@/src/validation/academicSessions.zod";
import CreateAcademicSession from "./CreateAcademicSession";
import { SessionsList } from "./_component/sessions-list";

export default async function Page() {
  const rows = await db.query.academicSessions.findMany({
    orderBy: (table, { desc }) => [desc(table.year)],
  });

  const sessions = (rows ?? []) as academicSessionType[];
  const active = sessions.find((row) => row.status === "ACTIVE");
  const inactive = sessions.filter((row) => row.status === "INACTIVE").length;

  return (
    <main className="my-6 w-full max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Academic sessions"
        subtitle="Every institute works inside one active session year."
        actions={<CreateAcademicSession />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {sessions.length === 0 ? (
            <Card className="flex flex-col items-center gap-1 p-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No sessions yet
              </p>
              <p className="text-xs text-muted-foreground">
                Create one before any institute can enrol students.
              </p>
            </Card>
          ) : (
            <SessionsList sessions={sessions} />
          )}
        </div>

        {/* what the active year actually controls */}
        <Card className="h-fit gap-0 overflow-hidden p-0">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Active session
            </h2>
            <p className="text-xs text-muted-foreground">
              The year new enrolments land in.
            </p>
          </div>

          <div className="space-y-3 p-4">
            {active ? (
              <>
                <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">
                  {active.year}
                </p>
                <p className="text-xs text-muted-foreground">
                  Students, sections and exams are all filed under this year.
                  Switching it does not move existing records.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  No session is active
                </p>
                <p className="text-xs text-muted-foreground">
                  Enrolment and mark entry will have nowhere to land until one is
                  switched on.
                </p>
              </>
            )}

            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>Total sessions</span>
              <span className="font-medium tabular-nums text-foreground">
                {sessions.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Archived years</span>
              <span className="font-medium tabular-nums text-foreground">
                {inactive}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
