import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import SubjectMonitoring from "../../../_component/exam-overview/subject-monitoring";

// Student-level monitoring is opened per section + subject, so the selection
// travels in the query string and the data is fetched on the client.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  const { id: examId } = await params;
  const query = await searchParams;

  // a repeated query param arrives as an array, which would fail uuid
  // validation later — take the first value consistently
  const pick = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const classId = pick("classId");
  const sectionId = pick("sectionId");
  const subjectId = pick("subjectId");

  if (!classId || !sectionId || !subjectId) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
        Select a class, section and subject to monitor.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
      <div className="mx-auto max-w-6xl">
        <SubjectMonitoring
          examId={examId}
          classId={classId}
          sectionId={sectionId}
          subjectId={subjectId}
        />
      </div>
    </div>
  );
}
