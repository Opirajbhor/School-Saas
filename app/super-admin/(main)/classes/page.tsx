import { DataTable } from "@/components/table/tanstack/data-table";
import { ClassesColumn } from "./_table/column";
import { classesType } from "@/src/validation/classes.zod";
import CreateClasses from "./CreateClasses";
import { getDefaultClasses } from "./_actions/classes.action";
import { SpinnerCustom } from "@/components/Spinner";

export default async function Page() {
  const result = await getDefaultClasses();
  if (!result.success) {
    return <SpinnerCustom />;
  }
  const classes = result.data;
  return (
    <div>
      <div>
        <h1 className="text-center my-5">
          All Classes List ({classes.length})
        </h1>
        <div className="flex items-center justify-center">
          <div>
            {/* Data Table Section */}
            <div>
              <DataTable
                columns={ClassesColumn}
                data={classes as classesType[]}
              />
            </div>
            <CreateClasses />
          </div>
        </div>
      </div>
    </div>
  );
}
