"use server";

import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import { instituteProfile, teachers } from "@/src/drizzle-DB/schema";
import { currentUser } from "../auth/currentUser.action";

export type SessionContext = {
  userId: string;
  role: string | null;
  /** teachers row id; "" for a superadmin, which has none */
  teacherId: string;
  /** institute id; "" for a superadmin */
  instituteId: string;
  institute: {
    status: string;
    name: string;
    nameBangla: string;
    logo: string | null;
  } | null;
};

/**
 * Everything the shell and the guards need about the current user, resolved in
 * one wave.
 *
 * Before this, a single dashboard request resolved the same facts several
 * times: getUserContext (teachers + institute), getOnboardingStep (institute +
 * teachers again) and getInstituteBranding (institute again). Each was a round
 * trip to Neon, and they ran in sequence — roughly 300 ms of pure waiting on
 * every page. `cache()` makes it one lookup per request, and Promise.all makes
 * it one network hop.
 */
export const getSessionContext = cache(
  async (): Promise<SessionContext | null> => {
    const session = await currentUser();
    const userId = session?.user?.id;
    if (!userId) return null;

    const role = (session?.user as { role?: string } | undefined)?.role ?? null;

    const [teacherRow, instituteRow] = await Promise.all([
      db.query.teachers.findFirst({
        where: eq(teachers.userId, userId),
        columns: { id: true, instituteId: true },
      }),
      db
        .select({
          id: instituteProfile.id,
          status: instituteProfile.status,
          name: instituteProfile.nameEnglish,
          nameBangla: instituteProfile.nameBangla,
          logo: instituteProfile.logo,
        })
        .from(instituteProfile)
        .where(eq(instituteProfile.userId, userId))
        .orderBy(asc(instituteProfile.createdAt))
        .limit(1),
    ]);

    const institute = instituteRow[0] ?? null;

    // a superadmin governs platform defaults and belongs to no institute, so it
    // has no teachers row — it still needs a context for the CRUD helpers
    if (!teacherRow && role !== "superadmin") {
      return {
        userId,
        role,
        teacherId: "",
        instituteId: institute?.id ?? "",
        institute: institute
          ? {
              status: institute.status,
              name: institute.name,
              nameBangla: institute.nameBangla,
              logo: institute.logo,
            }
          : null,
      };
    }

    return {
      userId,
      role,
      teacherId: teacherRow?.id ?? "",
      instituteId: teacherRow?.instituteId ?? "",
      institute: institute
        ? {
            status: institute.status,
            name: institute.name,
            nameBangla: institute.nameBangla,
            logo: institute.logo,
          }
        : null,
    };
  },
);
