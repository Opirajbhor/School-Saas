import ExamOverview from "../../_component/mark-entry-page/mark-entry-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Next.js 15+: params is a Promise
  const { id } = await params;

  return (
    <div>
      <div>
        <h1>exam id :{id}</h1>
      </div>
      <ExamOverview id={id} />
    </div>
  );
}
