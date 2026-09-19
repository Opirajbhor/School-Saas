// // src/lib/audit/create-audit-log.ts

// import { db } from "@/src/db";
// import { auditLogs } from "@/src/db/schema";

// type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// type CreateAuditLogInput = {
//   instituteId: string;
//   userId: string;

//   action: "CREATE" | "UPDATE" | "STATUS_CHANGE" | "DELETE";

//   entity: string;
//   entityId: string;

//   oldData?: unknown;
//   newData?: unknown;
// };

// export async function createAuditLog(tx: Tx, data: CreateAuditLogInput) {
//   const [auditLog] = await tx
//     .insert(auditLogs)
//     .values({
//       instituteId: data.instituteId,
//       userId: data.userId,
//       action: data.action,
//       entity: data.entity,
//       entityId: data.entityId,
//       oldData: data.oldData ?? null,
//       newData: data.newData ?? null,
//     })
//     .returning();

//   return auditLog;
// }
