import { DataTable } from "@/components/table/tanstack/data-table";
import { InstituteColumn } from "./_table/column";
import { InsituteProfileUpdateType } from "@/src/validation/institute-profile.zod";
import { db } from "@/src/drizzle-DB";

export default async function Page() {
  const insituteData = await db.query.instituteProfile.findMany();
  //   if (!insituteData.success) {
  //     return <SpinnerCustom />;
  //   }
  return (
    <div>
      <h1 className="text-center my-5">
        All Institute List ({insituteData.length})
      </h1>
      <div className="flex items-center justify-center">
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Data Table Section */}
            <div className="lg:col-span-4">
              <DataTable
                columns={InstituteColumn}
                data={insituteData as InsituteProfileUpdateType[]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
