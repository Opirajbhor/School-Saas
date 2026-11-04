"use server";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { currentUser } from "../auth/currentUser.action";
import { instituteProfile, teachers } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import { redirect } from "next/navigation";

// --------get user context -----------

export const getUserContext = cache(async () => {
  const session = await currentUser();

  if (!session?.user?.id) {
    return null;
  }
  const userId = session.user.id;
  const role = session.user.role;
  const userInfo = await db.query.teachers.findFirst({
    where: eq(teachers.userId, userId),
    columns: {
      id: true,
      instituteId: true,
    },
  });

  if (!userInfo) {
    // A superadmin governs platform-wide defaults and belongs to no institute,
    // so it has no teachers row. It still needs a context: the CRUD helpers
    // branch on `role` and scope it to `institute_id IS NULL` rows, which keeps
    // institute data out of reach.
    if (role === "superadmin") {
      return {
        userId,
        role,
        instituteId: "",
        teacherId: "",
      };
    }

    return null;
  }

  // A deactivated institute must lose access everywhere, not only on the
  // profile card: every action resolves its tenant through this helper.
  const [institute] = await db
    .select({ status: instituteProfile.status })
    .from(instituteProfile)
    .where(eq(instituteProfile.id, userInfo.instituteId))
    .limit(1);

  if (institute && institute.status !== "ACTIVE") {
    return null;
  }

  return {
    userId,
    role,
    instituteId: userInfo.instituteId,
    teacherId: userInfo.id,
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
