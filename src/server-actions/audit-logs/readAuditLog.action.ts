import { db } from "@/src/drizzle-DB";
import { getUserContext } from "../shared/get-user-context.action";
import { auditLogs } from "@/src/drizzle-DB/schema";
import { desc, eq } from "drizzle-orm";

export async function readAuditLogs() {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }

  const { instituteId } = ctx;

  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.instituteId, instituteId),
    with: {
      user: {
        columns: { name: true, email: true },
      },

    },
    orderBy: desc(auditLogs.createdAt), 
    limit: 10,
  });

  const data = logs.map((log) => ({
    id: log.id,
    action: log.action, // CREATE / UPDATE / DELETE
    entity: log.entity, // TEACHER / CLASS / ...
    entityId: log.entityId,
    description: log.description,
    createdAt: log.createdAt,
    userName: log.user?.name,
    userEmail: log.user?.email,
    ipAddress: log.ipAddress,
  }));

  return {
    success: true as const,
    data,
  };
}
