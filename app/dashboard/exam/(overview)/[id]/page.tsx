import ExamOverview from "../../_component/mark-entry-page/exam-overview";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <ExamOverview id={id} />
    </div>
  );
}
