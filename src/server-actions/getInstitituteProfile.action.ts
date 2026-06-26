"use server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { instituteProfile } from "../db/schema";
import { currentUser } from "./currentUser.action";

export async function getInstituteProfile() {
  const session = await currentUser();
  const userId = session?.user.id;
  if (!userId) {
    console.warn(" No active session found.");
    return null;
  }
  try {
    const profile = await db.query.instituteProfile.findFirst({
      where: eq(instituteProfile.userId, userId),
    });

    return profile || null;
  } catch (error) {
    console.error("Database error in getInstituteProfile:", error);
    throw new Error("Failed to fetch institute profile.");
  }
}
