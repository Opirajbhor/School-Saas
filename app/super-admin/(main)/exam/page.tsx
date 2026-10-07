import Link from "next/link";
import { ArrowBigRight } from "lucide-react";

export default async function Page() {
  return (
    <div>
      <div>
        <Link
          className="card flex items-center gap-2 p-10 border"
          href={"/super-admin/exam/mark-types"}
        >
          Go To Mark Types <ArrowBigRight />
        </Link>
        <Link
          className="card flex items-center gap-2 p-10 border"
          href={"/super-admin/exam/grade-ranges"}
        >
          Go To Grade Range <ArrowBigRight />
        </Link>
      </div>
    </div>
  );
}
