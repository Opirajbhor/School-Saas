"use server";
import { eq } from "drizzle-orm";
import { currentUser } from "../auth/currentUser.action";
import { teachers } from "@/src/drizzle-DB/schema";
import { db } from "@/src/drizzle-DB";
import { redirect } from "next/navigation";

// --------get user context -----------

export async function getUserContext() {
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

  return {
    userId,
    role,
    instituteId: userInfo.instituteId,
    teacherId: userInfo.id,
  };
}

// -------- verify authorization ---------
export async function requireUserContext() {
  const profile = await getUserContext();

  if (!profile?.userId) {
    redirect("/auth/login");
  }

  return profile;
}
