"use server";
import { cache } from "react";
import { eq } from "drizzle-orm";
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
    const profile = await db.query.instituteProfile.findFirst({
      where: eq(instituteProfile.userId, userId),
    });
    if (!profile?.eiin) {
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
