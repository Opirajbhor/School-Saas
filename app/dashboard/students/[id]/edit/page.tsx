import EditStudentForm from "./_components/edit-student-form";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditStudentForm id={id} />;
}
