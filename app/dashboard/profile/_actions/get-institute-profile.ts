"use server";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { instituteProfile } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";

// ================Temporary File ===================

type VerifyUserResult =
  | {
      success: true;
      profile: typeof instituteProfile.$inferSelect;
    }
  | {
      success: false;
      error: string;
    };

export const verifyUser = cache(async (): Promise<VerifyUserResult> => {
  const ctx = await getUserContext();

  if (!ctx) {
    return {
      success: false as const,
      error: "No User session foundF",
    };
  }
  const { userId } = ctx;
  try {
    // deterministic: a user with more than one institute row used to resolve
    // to whichever row the planner returned first, so printed documents could
    // carry another institute's name and logo
    const [profile] = await db
      .select()
      .from(instituteProfile)
      .where(eq(instituteProfile.userId, userId))
      .orderBy(asc(instituteProfile.createdAt))
      .limit(1);
    if (!profile?.eiin || profile.status !== "ACTIVE") {
      console.warn(
        `User ${userId} requested verification but is not an Institute Account.`,
      );
      return { success: false, error: "Not an Institute Account" };
    }
    return {
      success: true,
      profile,
    };
  } catch {
    return { success: false, error: "Server Database Failure" };
  }
});

export async function requireInstitute() {
  const result = await verifyUser();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.profile;
}

/**
 * Just what the sidebar shows: the institute's name and logo. Cached per
 * request, so the shell does not add a second round trip to every page.
 */
export const getInstituteBranding = cache(async () => {
  const ctx = await getUserContext();
  if (!ctx?.instituteId) return null;

  const [row] = await db
    .select({
      name: instituteProfile.nameEnglish,
      nameBangla: instituteProfile.nameBangla,
      logo: instituteProfile.logo,
    })
    .from(instituteProfile)
    .where(eq(instituteProfile.id, ctx.instituteId))
    .limit(1);

  return row ?? null;
});
