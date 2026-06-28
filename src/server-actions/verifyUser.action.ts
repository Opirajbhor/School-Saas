"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { instituteProfile } from "../db/schema";
import { currentUser } from "./currentUser.action";

export async function verifyUser() {
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
      profile: JSON.parse(JSON.stringify(profile)),
    };
  } catch (error) {
    console.error("Database error in verifyUser:", error);
    return { success: false, error: "Server Database Failure" };
  }
}
