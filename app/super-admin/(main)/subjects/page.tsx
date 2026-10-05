import { db } from "@/src/drizzle-DB";
import { DataTable } from "@/components/table/tanstack/data-table";
import { OutputSubjectType } from "@/src/validation/subjects.zod";
import { subjectsColumn } from "./_table/column";
import CreateSubject from "./createSubject";
import { isNull } from "drizzle-orm";
import { subjectDbSchema } from "@/src/drizzle-DB/schema";

export default async function Page() {
  const subjects = await db.query.subjectDbSchema.findMany({
    where: isNull(subjectDbSchema.instituteId),
  });
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
