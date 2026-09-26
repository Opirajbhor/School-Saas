import { redirect } from "next/navigation";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import Link from "next/link";
import { ArrowBigRight } from "lucide-react";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");

  return (
    <div>
      <div>
        <Link
          className="card flex items-center gap-2 p-10 border"
          href={"/dashboard/exam/create"}
        >
          Go To Exam Create <ArrowBigRight />
        </Link>
        <Link
          className="card flex items-center gap-2 p-10 border"
          href={"/dashboard/exam/mark-types"}
        >
          Go To Mark Types <ArrowBigRight />
        </Link>
        <Link
          className="card flex items-center gap-2 p-10 border"
          href={"/dashboard/exam/grade-ranges"}
        >
          Go To Grade Range <ArrowBigRight />
        </Link>
      </div>
    </div>
  );
}
