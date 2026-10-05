import { db } from "@/src/drizzle-DB";
import { DataTable } from "@/components/table/tanstack/data-table";
import { ClassesColumn } from "./_table/column";
import { classesType } from "@/src/validation/classes.zod";
import CreateClasses from "./CreateClasses";

export default async function Page() {
  const classes = await db.query.classesDrizzle.findMany();
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
