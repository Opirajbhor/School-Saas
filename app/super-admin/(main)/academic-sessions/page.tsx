import { db } from "@/src/drizzle-DB";
import { DataTable } from "@/components/table/tanstack/data-table";
import { SessionColumn } from "./_table/column";
import { academicSessionType } from "@/src/validation/academicSessions.zod";
import CreateAcademicSession from "./CreateAcademicSession";

export default async function Page() {
  const data = await db.query.academicSessions.findMany();
  const sessions = data ?? [];
  return (
    <div>
      <div>
        <h1 className="text-center my-5">
          All Academic Session List ({sessions.length})
        </h1>
        <div className="flex items-center justify-center">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Data Table Section */}
              <div>
                <DataTable
                  columns={SessionColumn}
                  data={sessions as academicSessionType[]}
                />
              </div>
              {/* create session */}
            </div>
            <CreateAcademicSession />
          </div>
        </div>
      </div>
    </div>
  );
}
