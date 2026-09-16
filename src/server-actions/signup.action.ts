"use server";
import { auth } from "../../auth";
import { SignUpType, signUpZod } from "../validation/auth.zod";
import { instituteProfile } from "../db/schema/institute-profile-schema.drizzle";
import { db } from "../db";
import { parseWithZod } from "../validation/validator.zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { teachers } from "../db/schema";

// user creation
export async function signUpAction(data: SignUpType) {
  const parsed = parseWithZod(signUpZod, data);
  if (!parsed.success) return parsed;
  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
  } catch (error) {
    console.error("error creating new user", error);
    return {
      success: false,
    };
  }
  redirect("/onboarding/institute");
}

// =========on boarding Steps============

export async function getOnboardingStep() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // -------step-1 check user exist -----------------
  if (!session?.user?.id) return redirect("/auth/login");

  const role = session.user.role;

  // -------step-2 check institute profile -----------------

  if (role === "admin") {
    const institute = await db.query.instituteProfile.findFirst({
      where: eq(instituteProfile.userId, session?.user?.id),
    });
    if (!institute) return redirect("/auth/onboarding/institute-profile");

    // -------step-3 check teacher profile -----------------

    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session?.user?.id),
    });
    if (!teacher) return redirect("/auth/onboarding/admin-profile");

    // ------------step-4 complete --------------------
    return redirect("/dashboard");
  }
}

export async function signUpActions(data: SignUpType) {
  // parse with zod-----------------
  const parsed = parseWithZod(signUpZod, data);
  if (!parsed.success) return parsed;
  // parse with zod-----------------

  // better auth user creation--------
  try {
    const authUser = await auth.api.signUpEmail({
      body: {
        name: parsed.data.adminNameEnglish,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    // Ensuring the auth user was actually created before moving to DB insert
    if (!authUser?.user?.id) {
      return { success: false, error: "Failed to create authentication user." };
    }
    // institute profile
    await db.insert(instituteProfile).values({
      userId: authUser.user.id,
      eiin: parsed.data.eiin,
      instituteNameBangla: parsed.data.instituteNameBangla,
      instituteNameEnglish: parsed.data.instituteNameEnglish,
      adminNameBangla: parsed.data.adminNameBangla,
      adminNameEnglish: parsed.data.adminNameEnglish,
      adminDesignation: parsed.data.adminDesignation,
      adminPhone: parsed.data.adminPhone,
      division: parsed.data.division,
      district: parsed.data.district,
      upazila: parsed.data.upazila,
    });
    return { success: true };
  } catch (error) {
    console.error("Signup Action Error:", error);
    return {
      success: false,
      error: error || "An unexpected database error occurred.",
    };
  }
}
