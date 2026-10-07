import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { subjectsColumn } from "./_table/column";
import CreateSubject from "./createSubject";
import { SpinnerCustom } from "@/components/Spinner";
import { getDefaultSubjects } from "./_actions/subjects.action";

export default async function Page() {
  const result = await getDefaultSubjects();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const subjects = result.data;
  return (
    <div>
      <div>
        <h1 className="text-center my-5">
          All subjects List ({subjects.length})
        </h1>
        <div className="flex items-center justify-center">
          <div>
            <div>
              {/* Data Table Section */}
              <div>
                <DataTable
                  columns={subjectsColumn}
                  data={subjects as OutputSubjectType[]}
                />
              </div>
            </div>
            <CreateSubject />
          </div>
        </div>
      </div>
    </div>
  );
}
