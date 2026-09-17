"use server";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { instituteProfile } from "../db/schema";
import { currentUser } from "./auth/currentUser.action";

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
  const session = await currentUser();
  const userId = session?.user?.id;
  if (!userId) {
    console.warn("No active session found.");
    return { success: false, error: "Unauthorized" };
  }
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
