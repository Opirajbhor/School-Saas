"use server";
import { eq } from "drizzle-orm";
import { currentUser } from "../auth/currentUser.action";
import { instituteProfile, teachers } from "@/src/db/schema";
import { db } from "@/src/db";
import { redirect } from "next/navigation";

// --------get user context -----------

export async function getUserContext() {
  const session = await currentUser();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const role = session.user.role;

  if (role === "admin") {
    const profile = await db.query.instituteProfile.findFirst({
      where: eq(instituteProfile.userId, userId),
      columns: {
        id: true,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      userId,
      role,
      instituteId: profile.id,
      teacherId: null,
    };
  }

  if (role === "user") {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, userId),
      columns: {
        id: true,
        instituteId: true,
      },
    });

    if (!teacher) {
      return null;
    }

    return {
      userId,
      role,
      instituteId: teacher.instituteId,
      teacherId: teacher.id,
    };
  }

  return null;
}

// -------- verify authorization ---------
export async function requireUserContext() {
  const profile = await getUserContext();

  if (!profile?.userId) {
    redirect("/auth/login");
  }

  return profile;
}
