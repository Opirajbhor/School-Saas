import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { subjectsColumn } from "./_table/column";
import CreateSubject from "./createSubject";
import { SpinnerCustom } from "@/components/Spinner";
import { getDefaultSubjects } from "./_actions/subjects.action";
import Link from "next/link";

export default async function Page() {
  const result = await getDefaultSubjects();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const subjects = result.data;
  return (
    <div>
      <div className="flex items-center justify-center ">
        <h1 className="text-center my-5">
          All subjects List ({subjects.length})
        </h1>
        <Link
          className="text-center p-3 border mb-20"
          href={"/super-admin/subjects/assignment"}
        >
          Subject Assignment
        </Link>
      </div>

      <div className="flex items-center justify-center">
        {/* Data Table Section */}
        <DataTable
          columns={subjectsColumn}
          data={subjects as OutputSubjectType[]}
        />
      </div>
      <CreateSubject />
    </div>
  );
}
