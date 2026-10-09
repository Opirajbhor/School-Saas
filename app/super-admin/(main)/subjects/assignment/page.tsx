import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputSubAssignType } from "@/src/validation/subjects.zod";
import { SpinnerCustom } from "@/components/Spinner";
import Link from "next/link";
import { subjectsAssignColumn } from "../_table/subjectAssign-column";
import { getDefaultAssignSubjects } from "../_actions/subjects.action";
import { SubjectAssign } from "./subject-assign-tab";

export default async function Page() {
  const result = await getDefaultAssignSubjects();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const subjects = result.data;
  return (
    <div>
      <div className="flex items-center justify-center ">
        <h1 className="text-center my-5">
          All subjects List ({subjects?.length})
        </h1>
        <Link
          className="text-center p-3 border mb-20"
          href={"/super-admin/subjects/assignment"}
        >
          Subject Assignment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* ✅ min-w-0 lets grid children shrink content properly */}
        <div className="lg:col-span-2 min-w-0">
          <DataTable
            columns={subjectsAssignColumn}
            data={subjects as OutputSubAssignType[]}
            filterColumn="className"
          />
        </div>

        <div className="lg:col-span-1 min-w-0 lg:min-w-[320px]">
          <SubjectAssign />
        </div>
      </div>
    </div>
  );
}
