"use server";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { instituteProfile } from "../db/schema";

export async function getInstituteProfile(userId: string) {
  return db.query.instituteProfile.findFirst({
    where: eq(instituteProfile.userId, userId),
  });
}
