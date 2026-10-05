import { db } from "@/src/drizzle-DB";
import { DataTable } from "@/components/table/tanstack/data-table";
import { GroupsColumn } from "./_table/column";
import { outputGroupType } from "@/src/validation/groups.zod";
import CreateGroups from "./CreateGroups";

export default async function Page() {
  const Groups = await db.query.groups.findMany();
  return (
    <div>
      <div>
        <h1 className="text-center my-5">All Groups List ({Groups.length})</h1>
        <div className="flex items-center justify-center">
          <div>
            {/* Data Table Section */}
            <div>
              <DataTable
                columns={GroupsColumn}
                data={Groups as outputGroupType[]}
              />
            </div>
            <CreateGroups />
          </div>
        </div>
      </div>
    </div>
  );
}
