"use server";
import { cache } from "react";
import { redirect } from "next/navigation";

import { getSessionContext } from "./get-session-context.action";

// --------get user context -----------
//
// Thin view over getSessionContext(): one cached lookup per request resolves the
// session, the teachers row and the institute together, instead of three
// helpers each paying their own round trip to Neon.
export const getUserContext = cache(async () => {
  const ctx = await getSessionContext();
  if (!ctx) return null;

  if (!ctx.teacherId && ctx.role !== "superadmin") return null;

  // a deactivated institute loses access everywhere, not only on the profile
  // card: every action resolves its tenant through this helper
  if (ctx.institute && ctx.institute.status !== "ACTIVE" && ctx.role !== "superadmin") {
    return null;
  }

  if (ctx.role === "superadmin" && !ctx.teacherId) {
    return {
      userId: ctx.userId,
      role: ctx.role,
      instituteId: "",
      teacherId: "",
    };
  }

  return {
    userId: ctx.userId,
    role: ctx.role,
    instituteId: ctx.instituteId,
    teacherId: ctx.teacherId,
  };
});

// -------- verify authorization ---------
export async function requireUserContext() {
  const profile = await getUserContext();

  if (!profile?.userId) {
    redirect("/auth/login");
  }

  return profile;
}
