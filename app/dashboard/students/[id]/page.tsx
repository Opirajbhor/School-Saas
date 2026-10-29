import StudentDetailView from "./_components/student-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StudentDetailView id={id} />;
}
