"use server";
import { getSessionContext } from "@/src/server-actions/shared/get-session-context.action";
import { auth } from "../../../auth";
import {
  AdminProfileInput,
  adminProfileZod,
  InstituteInput,
  instituteZod,
  SignUpType,
  signUpZod,
} from "../../validation/auth.zod";
import { instituteProfile } from "../../drizzle-DB/schema/institute-profile-schema.drizzle";
import { db } from "../../drizzle-DB";
import { parseWithZod } from "../../validation/validator.zod";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { teachers, user } from "../../drizzle-DB/schema";
import { currentUser } from "./currentUser.action";

// user creation
export async function signUpAction(data: SignUpType) {
  const parsed = parseWithZod(signUpZod, data);
  if (!parsed.success) return parsed;
  try {
    const newUser = await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    if (!newUser?.user) {
      return { success: false as const, error: "Signup failed", details: {} };
    }
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, newUser.user.id));
  } catch (error) {
    console.error("error creating new user", error);
    // the UI needs a message; returning a bare { success: false } left the
    // form with nothing to show
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not create the account",
      details: {},
    };
  }
  redirect("/auth/onboarding/institute-profile");
}

// =========on boarding Steps============

export async function getOnboardingStep() {
  // the same cached context the shell uses: no extra queries per page load
  const ctx = await getSessionContext();
  if (!ctx) return "UNAUTHORIZED";

  if (ctx.role === "superadmin") return "SUPERADMIN";
  if (ctx.role === "user") return "USER";
  if (ctx.role !== "admin") return "UNAUTHORIZED";

  if (!ctx.institute) return "INSTITUTE";
  if (!ctx.teacherId) return "ADMIN";
  return "COMPLETE";
}

// ------------------institute profile ---------------
export async function instituteProfileAction(data: InstituteInput) {
  const profile = await currentUser();
  if (profile?.user?.role !== "admin") {
    return {
      success: false as const,
      error: "UNAUTHORIZED",
      details: {},
    };
  }
  const validation = instituteZod.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      details: validation.error.flatten().fieldErrors,
    };
  }
  try {
    // one institute per account: without this, re-running onboarding created a
    // second row and every later lookup became ambiguous
    const [existing] = await db
      .select({ id: instituteProfile.id })
      .from(instituteProfile)
      .where(eq(instituteProfile.userId, profile?.user?.id as string))
      .limit(1);

    if (existing) {
      return {
        success: false as const,
        error: "This account already has an institute",
        details: {},
      };
    }

    await db.insert(instituteProfile).values({
      ...validation.data,
      userId: profile?.user?.id,
      status: "ACTIVE",
    });

    return { success: true };
  } catch (error) {
    console.error("RAW INSERT ERROR:", error);

    return {
      success: false,
      error: "Failed to create institute profile",
    };
  }
}

// --------- admin profile creation-----------
export async function adminProfileAction(data: AdminProfileInput) {
  // Onboarding step ADMIN runs before the admin has a `teachers` row, so
  // requireUserContext() would reject the very call that creates it and the
  // flow looped between login and onboarding. Derive the institute from the
  // profile row instead.
  const session = await currentUser();
  if (session?.user?.role !== "admin") {
    return {
      success: false as const,
      error: "UNAUTHORIZED",
      details: {},
    };
  }

  const [institute] = await db
    .select({ id: instituteProfile.id })
    .from(instituteProfile)
    .where(eq(instituteProfile.userId, session.user.id))
    .limit(1);

  if (!institute) {
    return {
      success: false as const,
      error: "Finish the institute details first",
      details: {},
    };
  }

  const instituteId = institute.id;
  const userId = session.user.id;
  // parse with zod-----------------
  const validatedFields = parseWithZod(adminProfileZod, data);
  if (!validatedFields.success) return validatedFields;
  try {
    const result = await db.transaction(async (tx) => {
      await tx
        .insert(teachers)
        .values({
          ...validatedFields.data,
          instituteId: instituteId,
          userId: userId,
        })
        .returning();
    });
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error("Failed to create Admin Profile", error);
    return {
      success: false as const,
      error: "Failed to create Admin Profile",
      details: {},
    };
  }
}
