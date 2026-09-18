import { redirect } from "next/navigation";
import { AccessServer } from "@/src/protected-routes/role-access-server";
import ClassesPage from "./ClassesPage";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  return <ClassesPage />;
}
