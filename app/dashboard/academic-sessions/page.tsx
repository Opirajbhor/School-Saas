import { db } from "@/src/drizzle-DB";
import { DataTable } from "@/components/table/tanstack/data-table";
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { redirect } from "next/navigation";
import { academicSessionType } from "@/src/validation/academicSessions.zod";
import { sql } from "drizzle-orm";
import { ClientSessionColumn } from "./_table/column";

export default async function Page() {
  const { allowed } = await AccessServer("admin");
  if (!allowed) redirect("/unauthorize");
  const data = await db.query.academicSessions.findMany({
    orderBy: (sessions) => [
      sql`CASE WHEN ${sessions.status} = 'ACTIVE' THEN 0 ELSE 1 END`,
      sessions.year,
    ],
  });
  const sessions = data ?? [];
  return (
    <div>
      <div>
        <h1 className="text-center my-5">
          All Academic Session List ({sessions.length})
        </h1>

        {/* Data Table Section */}
        <div className="p-5">
          <DataTable
            columns={ClientSessionColumn}
            data={sessions as academicSessionType[]}
          />
        </div>
      </div>
    </div>
  );
}
