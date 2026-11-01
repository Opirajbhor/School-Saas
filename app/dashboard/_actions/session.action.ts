"use server";

import { db } from "@/src/drizzle-DB";
import { academicSessions } from "@/src/drizzle-DB/schema";
import { and, eq } from "drizzle-orm";

// The active session year. Session years are created by the platform admin, so
// institutes only ever read this.
export async function getActiveSession() {
  return await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.status, "ACTIVE")),
  });
}
