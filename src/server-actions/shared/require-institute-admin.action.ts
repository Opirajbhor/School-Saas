"use server";

import { getUserContext } from "./get-user-context.action";

/**
 * Institute-side mutation gate.
 *
 * Several dashboard actions (students, teachers, assignments) resolve their
 * institute with a helper that a teacher's login also satisfies — so the action
 * was callable by any teacher in the tenant. This is the missing role test;
 * it also drops a suspended institute, since getUserContext refuses those.
 */
export async function requireInstituteAdmin() {
  const ctx = await getUserContext();

  if (!ctx?.instituteId) {
    return {
      success: false as const,
      error: "Not authorized",
      details: {} as Record<string, string[]>,
    };
  }

  if (ctx.role !== "admin" && ctx.role !== "superadmin") {
    return {
      success: false as const,
      error: "Only an institute admin can do this",
      details: {} as Record<string, string[]>,
    };
  }

  return { success: true as const, data: ctx };
}
