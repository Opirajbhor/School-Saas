import { DataTable } from "@/components/table/tanstack/data-table";
import { GroupsColumn } from "./_table/column";
import { OutputGroupClassType } from "@/src/validation/groups.zod";
import CreateGroups from "./CreateGroups";
import { getDefaultGroupClasses } from "./_actions/groups.action";
import { SpinnerCustom } from "@/components/Spinner";

export default async function Page() {
  const result = await getDefaultGroupClasses();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const groups = result.data;
  return (
    <div>
      <div>
        <h1 className="text-center my-5">All Groups List ({groups.length})</h1>
        <div className="flex items-center justify-center">
          <div>
            {/* Data Table Section */}
            <div>
              <DataTable
                columns={GroupsColumn}
                data={groups as OutputGroupClassType[]}
              />
            </div>
            <CreateGroups />
          </div>
        </div>
      </div>
    </div>
  );
}
