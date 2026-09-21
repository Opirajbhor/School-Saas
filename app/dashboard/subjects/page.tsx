import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import SubjectPage from "./_components/SubjectPage";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  return <SubjectPage />;
}
