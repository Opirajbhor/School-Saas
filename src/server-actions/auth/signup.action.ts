"use server";
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
import { createRecord } from "../crud-funtions/server-create-crud";
import { currentUser } from "./currentUser.action";
import { requireUserContext } from "../shared/get-user-context.action";

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
    return {
      success: false,
    };
  }
  redirect("/auth/onboarding/institute-profile");
}

// =========on boarding Steps============

export async function getOnboardingStep() {
  const session = await currentUser();

  // -------step-1 check user exist -----------------
  if (!session?.user?.id) return "UNAUTHORIZED";

  const role = session.user.role;

  if (role === "user") {
    return "USER";
  }
  // -------step-2 check institute profile -----------------

  if (role === "admin") {
    const institute = await db.query.instituteProfile.findFirst({
      where: eq(instituteProfile.userId, session?.user?.id),
    });
    if (!institute) return "INSTITUTE";

    // -------step-3 check teacher profile -----------------

    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session?.user?.id),
    });
    if (!teacher) return "ADMIN";

    // ------------step-4 complete --------------------
    return "COMPLETE";
  }
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
  const { role, instituteId, userId } = await requireUserContext();
  if (role !== "admin") {
    return {
      success: false as const,
      error: "UNAUTHORIZED",
      details: {},
    };
  }
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
