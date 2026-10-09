import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { SpinnerCustom } from "@/components/Spinner";
import { getSubjects } from "../_actions/subjects.action";
import { subjectsColumn } from "../_table/columns";

export default async function Page() {
  const result = await getSubjects();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const subjects = result.data;
  console.log(subjects);
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
          </div>
        </div>
      </div>
    </div>
  );
}
