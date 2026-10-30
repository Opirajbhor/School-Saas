import { DataTable } from "@/components/table/tanstack/data-table";
import { SuperAdminColumn } from "./_table/column";
import { SuperAdminType } from "@/src/validation/superadmin.zod";
import CreateSuperAdmin from "./CreateSuperAdmin";
import { getSuperAdmins } from "./_actions/superadmin.action";
import { SpinnerCustom } from "@/components/Spinner";

export default async function Page() {
  const result = await getSuperAdmins();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const superAdmins = result.data;
  return (
    <div>
      <div>
        <h1 className="text-center my-5">
          All Superadmins List ({superAdmins.length})
        </h1>
        <div className="flex items-center justify-center">
          <div>
            {/* Data Table Section */}
            <div>
              <DataTable
                columns={SuperAdminColumn}
                data={superAdmins as SuperAdminType[]}
              />
            </div>
            <CreateSuperAdmin />
          </div>
        </div>
      </div>
    </div>
  );
}
