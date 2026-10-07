"use server";

import { db } from "@/src/drizzle-DB";
import { academicSessions } from "@/src/drizzle-DB/schema";
import { and, eq } from "drizzle-orm";

// get Active Academic Session
export async function getActiveSession() {
  return await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.status, "ACTIVE")),
  });
}
