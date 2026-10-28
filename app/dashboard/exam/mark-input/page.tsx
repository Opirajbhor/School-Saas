import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import MarkInputPage from "../_component/mark-input-page/mark-input-form";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  return <MarkInputPage />;
}
