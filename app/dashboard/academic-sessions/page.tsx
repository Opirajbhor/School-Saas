import { redirect } from "next/navigation";
import AcademicSessionPage from "./academicSessionPage";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  return <AcademicSessionPage />;
}
